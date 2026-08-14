import { label } from "@/lib/constants";

const colours: Record<string, string> = {
  CONFIRMED: "green",
  COMPLETED: "green",
  DELIVERED: "green",
  PAYMENT_DONE: "green",
  ACTIVE: "green",
  PROCESS: "blue",
  ADVANCE_RECEIVED: "blue",
  WAITING: "yellow",
  PENDING: "yellow",
  BALANCE: "yellow",
  HOLD: "yellow",
  CANCELLED: "red",
  DISABLED: "gray",
};

export function StatusBadge({ value }: { value: string }) {
  return <span className={`badge badge-${colours[value] ?? "gray"}`}>{label(value)}</span>;
}
