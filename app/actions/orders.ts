"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOwner, requireShopUser } from "@/lib/auth";
import {
  DELIVERY_STATUSES,
  MATERIALS,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  THICKNESSES,
  WORKFLOW_STAGES,
  WORK_STATUSES,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { activityLogs, orderItems, orders, workStages } from "@/lib/db/schema";

const itemSchema = z.object({
  description: z.string().trim().min(1).max(120),
  height: z.coerce.number().positive(),
  width: z.coerce.number().positive(),
  pieces: z.coerce.number().int().positive().max(10000),
  thickness: z.enum(THICKNESSES),
  material: z.enum(MATERIALS),
  remarks: z.string().trim().max(300).optional(),
});

const orderSchema = z.object({
  orderNumber: z.coerce.number().int().positive(),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().max(20).optional(),
  orderStatus: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  totalAmount: z.union([z.literal(""), z.coerce.number().nonnegative()]).optional(),
  advanceAmount: z.union([z.literal(""), z.coerce.number().nonnegative()]).optional(),
  dueDate: z.string().optional(),
  remarks: z.string().trim().max(500).optional(),
  items: z.array(itemSchema).min(1).max(25),
});

export async function createOrderAction(formData: FormData) {
  const actor = await requireOwner();
  let rawItems: unknown = [];
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    redirect("/orders/new?error=Invalid+item+details");
  }
  const parsed = orderSchema.safeParse({ ...Object.fromEntries(formData), items: rawItems });
  if (!parsed.success) redirect("/orders/new?error=Please+check+the+order+and+item+details");
  const duplicate = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.shopId, actor.shopId), eq(orders.orderNumber, parsed.data.orderNumber)))
    .limit(1);
  if (duplicate.length) redirect("/orders/new?error=That+order+number+already+exists");
  const orderId = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        shopId: actor.shopId,
        orderNumber: parsed.data.orderNumber,
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone || null,
        orderStatus: parsed.data.orderStatus,
        paymentStatus: parsed.data.paymentStatus,
        totalAmount:
          parsed.data.totalAmount === "" || parsed.data.totalAmount === undefined
            ? null
            : String(parsed.data.totalAmount),
        advanceAmount:
          parsed.data.advanceAmount === "" || parsed.data.advanceAmount === undefined
            ? null
            : String(parsed.data.advanceAmount),
        dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T12:00:00`) : null,
        remarks: parsed.data.remarks || null,
        createdBy: actor.id,
      })
      .returning({ id: orders.id });
    for (const [index, item] of parsed.data.items.entries()) {
      const [createdItem] = await tx
        .insert(orderItems)
        .values({
          orderId: order.id,
          serialNumber: index + 1,
          description: item.description,
          height: String(item.height),
          width: String(item.width),
          pieces: item.pieces,
          thickness: item.thickness,
          material: item.material,
          remarks: item.remarks || null,
        })
        .returning({ id: orderItems.id });
      await tx.insert(workStages).values(
        WORKFLOW_STAGES.map((stage) => ({
          orderItemId: createdItem.id,
          stage,
          status: "WAITING" as const,
        })),
      );
    }
    await tx.insert(activityLogs).values({
      shopId: actor.shopId,
      userId: actor.id,
      action: "ORDER_CREATED",
      entityType: "order",
      entityId: order.id,
    });
    return order.id;
  });
  redirect(`/orders/${orderId}`);
}

export async function updateStageAction(formData: FormData) {
  const actor = await requireShopUser();
  const stageId = z.string().uuid().parse(formData.get("stageId"));
  const status = z.enum(WORK_STATUSES).parse(formData.get("status"));
  const [record] = await db
    .select({
      id: workStages.id,
      orderId: orders.id,
      shopId: orders.shopId,
      oldStatus: workStages.status,
    })
    .from(workStages)
    .innerJoin(orderItems, eq(workStages.orderItemId, orderItems.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(workStages.id, stageId), eq(orders.shopId, actor.shopId)))
    .limit(1);
  if (!record) throw new Error("Work stage not found");
  await db.transaction(async (tx) => {
    await tx
      .update(workStages)
      .set({ status, updatedBy: actor.id, updatedAt: new Date() })
      .where(eq(workStages.id, stageId));
    await tx.insert(activityLogs).values({
      shopId: actor.shopId,
      userId: actor.id,
      action: "STAGE_UPDATED",
      entityType: "order",
      entityId: record.orderId,
      details: `${record.oldStatus}->${status}`,
    });
  });
  revalidatePath("/tasks");
  revalidatePath(`/orders/${record.orderId}`);
}

export async function updateDeliveryAction(formData: FormData) {
  const actor = await requireShopUser();
  const itemId = z.string().uuid().parse(formData.get("itemId"));
  const status = z.enum(DELIVERY_STATUSES).parse(formData.get("status"));
  const [record] = await db
    .select({ orderId: orders.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orderItems.id, itemId), eq(orders.shopId, actor.shopId)))
    .limit(1);
  if (!record) throw new Error("Order item not found");
  await db.update(orderItems).set({ deliveryStatus: status }).where(eq(orderItems.id, itemId));
  await db.insert(activityLogs).values({
    shopId: actor.shopId,
    userId: actor.id,
    action: "DELIVERY_UPDATED",
    entityType: "order",
    entityId: record.orderId,
    details: status,
  });
  revalidatePath("/tasks");
  revalidatePath(`/orders/${record.orderId}`);
}

export async function deleteOrderAction(formData: FormData) {
  const actor = await requireOwner();
  const orderId = z.string().uuid().parse(formData.get("orderId"));
  const [record] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.shopId, actor.shopId)))
    .limit(1);
  if (!record) throw new Error("Order not found");
  await db.delete(orders).where(eq(orders.id, orderId));
  redirect("/orders?success=Order+deleted");
}

const orderUpdateSchema = orderSchema.omit({ orderNumber: true, items: true }).extend({
  orderId: z.string().uuid(),
});

export async function updateOrderAction(formData: FormData) {
  const actor = await requireOwner();
  const parsed = orderUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Please check the order details");

  const [record] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.id, parsed.data.orderId), eq(orders.shopId, actor.shopId)))
    .limit(1);
  if (!record) throw new Error("Order not found");

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone || null,
        orderStatus: parsed.data.orderStatus,
        paymentStatus: parsed.data.paymentStatus,
        totalAmount:
          parsed.data.totalAmount === "" || parsed.data.totalAmount === undefined
            ? null
            : String(parsed.data.totalAmount),
        advanceAmount:
          parsed.data.advanceAmount === "" || parsed.data.advanceAmount === undefined
            ? null
            : String(parsed.data.advanceAmount),
        dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T12:00:00`) : null,
        remarks: parsed.data.remarks || null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, record.id));
    await tx.insert(activityLogs).values({
      shopId: actor.shopId,
      userId: actor.id,
      action: "ORDER_UPDATED",
      entityType: "order",
      entityId: record.id,
    });
  });

  revalidatePath(`/orders/${record.id}`);
  revalidatePath("/orders");
}
