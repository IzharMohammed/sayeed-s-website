export const ORDER_STATUSES = ["CONFIRMED", "HOLD", "CANCELLED"] as const;
export const PAYMENT_STATUSES = ["ADVANCE_RECEIVED", "PAYMENT_DONE", "BALANCE"] as const;
export const THICKNESSES = [
  "4mm",
  "5mm",
  "8mm",
  "10mm",
  "12mm",
  "18mm",
  "24mm",
  "28mm",
  "30mm",
] as const;
export const MATERIALS = [
  "Glass",
  "Acrylic",
  "Tiles",
  "Granite",
  "Door",
  "Almirah",
  "SS-Sheet",
  "ACP",
  "MDF",
  "LED",
] as const;
export const WORKFLOW_STAGES = ["DESIGN", "CUTTING", "PRE_COAT", "PRINTING", "POST_COAT"] as const;
export const WORK_STATUSES = ["WAITING", "PROCESS", "COMPLETED"] as const;
export const DELIVERY_STATUSES = ["PENDING", "DELIVERED"] as const;

export const LABELS: Record<string, string> = {
  CONFIRMED: "Confirmed",
  HOLD: "Hold",
  CANCELLED: "Cancelled",
  ADVANCE_RECEIVED: "Advance received",
  PAYMENT_DONE: "Payment done",
  BALANCE: "Balance",
  DESIGN: "Design",
  CUTTING: "Cutting",
  PRE_COAT: "Pre-coat",
  PRINTING: "Printing",
  POST_COAT: "Post-coat",
  WAITING: "Waiting",
  PROCESS: "In process",
  COMPLETED: "Completed",
  PENDING: "Pending",
  DELIVERED: "Delivered",
  PLATFORM_ADMIN: "Platform admin",
  OWNER: "Owner",
  WORKER: "Worker",
};

export function label(value: string) {
  return LABELS[value] ?? value;
}
