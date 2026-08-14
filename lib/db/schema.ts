import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["PLATFORM_ADMIN", "OWNER", "WORKER"]);
export const orderStatusEnum = pgEnum("order_status", ["CONFIRMED", "HOLD", "CANCELLED"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "ADVANCE_RECEIVED",
  "PAYMENT_DONE",
  "BALANCE",
]);
export const workStageEnum = pgEnum("work_stage", [
  "DESIGN",
  "CUTTING",
  "PRE_COAT",
  "PRINTING",
  "POST_COAT",
]);
export const workStatusEnum = pgEnum("work_status", ["WAITING", "PROCESS", "COMPLETED"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["PENDING", "DELIVERED"]);

export const shops = pgTable("shops", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  setupComplete: boolean("setup_complete").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull(),
    active: boolean("active").default(true).notNull(),
    mustChangePassword: boolean("must_change_password").default(false).notNull(),
    createdBy: uuid("created_by"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_shop_username_unique").on(table.shopId, table.username),
    index("users_shop_idx").on(table.shopId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    orderNumber: integer("order_number").notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    orderStatus: orderStatusEnum("order_status").default("CONFIRMED").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").default("ADVANCE_RECEIVED").notNull(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
    advanceAmount: numeric("advance_amount", { precision: 12, scale: 2 }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    remarks: text("remarks"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("orders_shop_number_unique").on(table.shopId, table.orderNumber),
    index("orders_shop_idx").on(table.shopId),
  ],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  serialNumber: integer("serial_number").notNull(),
  description: text("description").notNull(),
  height: numeric("height", { precision: 10, scale: 2 }).notNull(),
  width: numeric("width", { precision: 10, scale: 2 }).notNull(),
  measurementUnit: text("measurement_unit").default("inch").notNull(),
  pieces: integer("pieces").default(1).notNull(),
  thickness: text("thickness").notNull(),
  material: text("material").notNull(),
  deliveryStatus: deliveryStatusEnum("delivery_status").default("PENDING").notNull(),
  remarks: text("remarks"),
});

export const workStages = pgTable(
  "work_stages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderItemId: uuid("order_item_id")
      .references(() => orderItems.id, { onDelete: "cascade" })
      .notNull(),
    stage: workStageEnum("stage").notNull(),
    status: workStatusEnum("status").default("WAITING").notNull(),
    updatedBy: uuid("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("work_stages_item_stage_unique").on(table.orderItemId, table.stage)],
);

export const attachments = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderItemId: uuid("order_item_id")
    .references(() => orderItems.id, { onDelete: "cascade" })
    .notNull(),
  objectKey: text("object_key").notNull().unique(),
  originalName: text("original_name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    details: text("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("activity_shop_idx").on(table.shopId)],
);

export type AppUser = typeof users.$inferSelect;
