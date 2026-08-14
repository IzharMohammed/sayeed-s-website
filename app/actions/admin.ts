"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { normalizeUsername } from "@/lib/format";

const shopSchema = z.object({
  shopName: z.string().trim().min(2).max(80),
  shopCode: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/),
  ownerName: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(8).max(100),
});

export async function createShopAction(formData: FormData) {
  const administrator = await requirePlatformAdmin();
  const parsed = shopSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect("/admin?error=Check+the+shop+and+owner+details");
  }

  const shopCode = parsed.data.shopCode.toUpperCase();
  if (shopCode === "ADMIN") redirect("/admin?error=ADMIN+is+a+reserved+shop+code");

  const existing = await db
    .select({ id: shops.id })
    .from(shops)
    .where(eq(shops.code, shopCode))
    .limit(1);
  if (existing.length) redirect("/admin?error=That+shop+code+already+exists");

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.transaction(async (tx) => {
    const [shop] = await tx
      .insert(shops)
      .values({ name: parsed.data.shopName, code: shopCode, setupComplete: true })
      .returning({ id: shops.id });

    await tx.insert(users).values({
      shopId: shop.id,
      name: parsed.data.ownerName,
      username: normalizeUsername(parsed.data.username),
      passwordHash,
      role: "OWNER",
      mustChangePassword: true,
      createdBy: administrator.id,
    });
  });

  redirect("/admin?success=Shop+and+first+owner+created");
}
