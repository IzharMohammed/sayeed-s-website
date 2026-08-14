import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { getR2Client } from "@/lib/r2";

const schema = z.object({
  orderItemId: z.string().uuid(),
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
  if (!parsed.success)
    return NextResponse.json(
      { error: "Use a JPG, PNG or WebP image below 10 MB" },
      { status: 400 },
    );
  const [item] = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orderItems.id, parsed.data.orderItemId), eq(orders.shopId, user.shopId)))
    .limit(1);
  if (!item) return NextResponse.json({ error: "Order item not found" }, { status: 404 });
  const extension =
    parsed.data.type === "image/png" ? "png" : parsed.data.type === "image/webp" ? "webp" : "jpg";
  const key = `shops/${user.shopId}/items/${item.id}/${crypto.randomUUID()}.${extension}`;
  const url = await getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: parsed.data.type,
    }),
    { expiresIn: 300 },
  );
  return NextResponse.json({ url, key });
}
