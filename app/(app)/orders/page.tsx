import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { ClipboardList, Plus, Search } from "lucide-react";
import Link from "next/link";
import { ClickableTableRow } from "@/components/clickable-table-row";
import { StatusBadge } from "@/components/status-badge";
import { requireShopUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; success?: string }>;
}) {
  const user = await requireShopUser();
  const { q = "", success } = await searchParams;
  const where = q
    ? and(
        eq(orders.shopId, user.shopId),
        or(ilike(orders.customerName, `%${q}%`), ilike(orders.customerPhone, `%${q}%`)),
      )
    : eq(orders.shopId, user.shopId);
  const rows = await db
    .select({ order: orders, itemCount: count(orderItems.id) })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(where)
    .groupBy(orders.id)
    .orderBy(desc(orders.createdAt));
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">Orders</div>
          <h1>All orders</h1>
          <p>Search and follow every customer order.</p>
        </div>
        {user.role !== "WORKER" && (
          <Link className="button button-primary" href="/orders/new">
            <Plus size={17} /> Add order
          </Link>
        )}
      </header>
      {success && <div className="success-box">{success}</div>}
      <section className="panel">
        <div className="panel-header">
          <form className="search">
            <Search size={16} />
            <input
              className="input"
              name="q"
              defaultValue={q}
              placeholder="Search customer or phone"
            />
          </form>
          <span className="muted">{rows.length} orders</span>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order no.</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Order details</th>
                  {user.role === "OWNER" && <th>Payment details</th>}
                  <th>Due date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ order, itemCount }) => (
                  <ClickableTableRow key={order.id} href={`/orders/${order.id}`}>
                    <td data-label="Order">
                      <span className="table-link">#{order.orderNumber}</span>
                    </td>
                    <td data-label="Customer">
                      <strong>{order.customerName}</strong>
                      {order.customerPhone && <div className="muted">{order.customerPhone}</div>}
                    </td>
                    <td data-label="Items">{itemCount}</td>
                    <td data-label="Order details">
                      <StatusBadge value={order.orderStatus} />
                    </td>
                    {user.role === "OWNER" && (
                      <td data-label="Payment">
                        <StatusBadge value={order.paymentStatus} />
                      </td>
                    )}
                    <td data-label="Due date">{formatDate(order.dueDate)}</td>
                  </ClickableTableRow>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <ClipboardList size={28} />
            <strong>No matching orders</strong>
            {q
              ? "Try another customer name or phone number."
              : "The owner can add the first order."}
          </div>
        )}
      </section>
    </>
  );
}
