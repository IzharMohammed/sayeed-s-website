"use server";

import bcrypt from "bcryptjs";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { activityLogs, sessions, users } from "@/lib/db/schema";
import { normalizeUsername } from "@/lib/format";

const memberSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(8).max(100),
  role: z.enum(["OWNER", "WORKER"]),
});

export async function createMemberAction(formData: FormData) {
  const actor = await requireOwner();
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    redirect("/team?error=Check+the+details.+Password+must+have+at+least+8+characters");
  const username = normalizeUsername(parsed.data.username);
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.shopId, actor.shopId), eq(users.username, username)))
    .limit(1);
  if (existing.length) redirect("/team?error=That+username+is+already+being+used");
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [created] = await db
    .insert(users)
    .values({
      shopId: actor.shopId,
      name: parsed.data.name,
      username,
      passwordHash,
      role: parsed.data.role,
      mustChangePassword: true,
      createdBy: actor.id,
    })
    .returning({ id: users.id });
  await db.insert(activityLogs).values({
    shopId: actor.shopId,
    userId: actor.id,
    action: "MEMBER_CREATED",
    entityType: "user",
    entityId: created.id,
    details: `${parsed.data.role}:${username}`,
  });
  redirect("/team?success=Team+member+created");
}

export async function toggleMemberAction(formData: FormData) {
  const actor = await requireOwner();
  const targetId = z.string().uuid().parse(formData.get("userId"));
  const [target] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, targetId), eq(users.shopId, actor.shopId)))
    .limit(1);
  if (!target) redirect("/team?error=Team+member+not+found");
  if (target.id === actor.id) redirect("/team?error=You+cannot+disable+your+own+account");
  if (target.role === "OWNER" && target.active) {
    const [activeOwners] = await db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.shopId, actor.shopId), eq(users.role, "OWNER"), eq(users.active, true)));
    if (activeOwners.value <= 1) redirect("/team?error=A+shop+must+always+have+one+active+owner");
  }
  await db.update(users).set({ active: !target.active }).where(eq(users.id, target.id));
  if (target.active) await db.delete(sessions).where(eq(sessions.userId, target.id));
  await db.insert(activityLogs).values({
    shopId: actor.shopId,
    userId: actor.id,
    action: target.active ? "MEMBER_DISABLED" : "MEMBER_ENABLED",
    entityType: "user",
    entityId: target.id,
  });
  revalidatePath("/team");
}
