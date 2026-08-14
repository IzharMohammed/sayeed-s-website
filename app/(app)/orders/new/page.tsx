import { eq, max } from "drizzle-orm";
import { OrderForm } from "@/components/order-form";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireOwner();
  const [value] = await db
    .select({ max: max(orders.orderNumber) })
    .from(orders)
    .where(eq(orders.shopId, user.shopId));
  const { error } = await searchParams;
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">New order</div>
          <h1>Add customer work</h1>
          <p>Enter the order once. Workers can update each stage later.</p>
        </div>
      </header>
      <OrderForm nextOrderNumber={Number(value.max ?? 0) + 1} error={error} />
    </>
  );
}
