import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { activityLogs, attachments, orderItems, orders } from "@/lib/db/schema";

const schema = z.object({
  orderItemId: z.string().uuid(),
  key: z.string().min(1).max(500),
  name: z.string().min(1).max(180),
  type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
});

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  if (!currentUser.shopId || currentUser.role === "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Upload not allowed" }, { status: 403 });
  }
  const user = { ...currentUser, shopId: currentUser.shopId };
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  const [item] = await db
    .select({ id: orderItems.id, orderId: orders.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orderItems.id, parsed.data.orderItemId), eq(orders.shopId, user.shopId)))
    .limit(1);
  const expectedPrefix = `shops/${user.shopId}/items/${parsed.data.orderItemId}/`;
  if (!item || !parsed.data.key.startsWith(expectedPrefix))
    return NextResponse.json({ error: "Upload not allowed" }, { status: 403 });
  await db.transaction(async (tx) => {
    await tx.insert(attachments).values({
      orderItemId: item.id,
      objectKey: parsed.data.key,
      originalName: parsed.data.name,
      contentType: parsed.data.type,
      size: parsed.data.size,
      uploadedBy: user.id,
    });
    await tx.insert(activityLogs).values({
      shopId: user.shopId,
      userId: user.id,
      action: "IMAGE_UPLOADED",
      entityType: "order",
      entityId: item.orderId,
    });
  });
  return NextResponse.json({ ok: true });
}
