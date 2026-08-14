"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, requireUser, secureTokenEquals } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { normalizeUsername } from "@/lib/format";

const loginSchema = z.object({
  username: z.string().trim().min(3).max(30),
  password: z.string().min(8).max(100),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/login?error=Please+check+your+login+details");
  const username = normalizeUsername(parsed.data.username);
  const result = await db
    .select({ user: users })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const user = result[0]?.user;
  if (!user?.active || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    redirect("/login?error=Incorrect+username+or+password");
  }
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id);
  if (user.mustChangePassword) redirect("/change-password");
  redirect(user.role === "WORKER" ? "/tasks" : "/dashboard");
}

const setupSchema = z.object({
  token: z.string().min(1),
  shopName: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(8).max(100),
  confirmPassword: z.string(),
});

export async function setupAction(formData: FormData) {
  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    redirect("/setup?error=Please+check+all+fields.+Password+must+have+at+least+8+characters");
  if (parsed.data.password !== parsed.data.confirmPassword)
    redirect("/setup?error=Passwords+do+not+match");
  const expectedToken = process.env.INITIAL_SETUP_TOKEN;
  if (!expectedToken || !secureTokenEquals(parsed.data.token, expectedToken))
    redirect("/setup?error=Invalid+setup+token");
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length) redirect("/login?error=Initial+setup+has+already+been+completed");
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const userId = await db.transaction(async (tx) => {
    const [shop] = await tx
      .insert(shops)
      .values({ name: parsed.data.shopName, code: "WORKSHOP", setupComplete: true })
      .returning({ id: shops.id });
    const [user] = await tx
      .insert(users)
      .values({
        shopId: shop.id,
        name: parsed.data.name,
        username: normalizeUsername(parsed.data.username),
        passwordHash,
        role: "OWNER",
      })
      .returning({ id: users.id });
    return user.id;
  });
  await createSession(userId);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const passwordChangeSchema = z
  .object({
    password: z.string().min(8).max(100),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
  });

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect("/change-password?error=Passwords+must+match+and+have+at+least+8+characters");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db
    .update(users)
    .set({ passwordHash, mustChangePassword: false })
    .where(eq(users.id, user.id));
  await destroySession();
  await createSession(user.id);
  redirect(user.role === "OWNER" ? "/dashboard" : "/tasks");
}
