import { and, count, desc, eq, ne, sql } from "drizzle-orm";
import { AlertCircle, ClipboardCheck, Clock3, IndianRupee, Plus } from "lucide-react";
import Link from "next/link";
import { ClickableTableRow } from "@/components/clickable-table-row";
import { StatusBadge } from "@/components/status-badge";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { formatDate, formatMoney } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireOwner();
  const [[orderCount], [activeCount], [deliveryCount], [balanceTotal], recent] = await Promise.all([
    db.select({ value: count() }).from(orders).where(eq(orders.shopId, user.shopId)),
    db
      .select({ value: count() })
      .from(orders)
      .where(and(eq(orders.shopId, user.shopId), ne(orders.orderStatus, "CANCELLED"))),
    db
      .select({ value: count() })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.shopId, user.shopId), eq(orderItems.deliveryStatus, "PENDING"))),
    db
      .select({
        value: sql<string>`coalesce(sum(${orders.totalAmount} - coalesce(${orders.advanceAmount}, 0)), 0)`,
      })
      .from(orders)
      .where(and(eq(orders.shopId, user.shopId), eq(orders.paymentStatus, "BALANCE"))),
    db
      .select()
      .from(orders)
      .where(eq(orders.shopId, user.shopId))
      .orderBy(desc(orders.createdAt))
      .limit(7),
  ]);
  const stats = [
    {
      label: "Total orders",
      value: orderCount.value,
      caption: "All recorded orders",
      icon: ClipboardCheck,
    },
    {
      label: "Active orders",
      value: activeCount.value,
      caption: "Confirmed or on hold",
      icon: Clock3,
    },
    {
      label: "Pending delivery",
      value: deliveryCount.value,
      caption: "Items yet to deliver",
      icon: AlertCircle,
    },
    {
      label: "Balance due",
      value: formatMoney(balanceTotal.value),
      caption: "Outstanding payment",
      icon: IndianRupee,
    },
  ];
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">Overview</div>
          <h1>Good day, {user.name.split(" ")[0]}</h1>
          <p>Here’s what is happening in your workshop.</p>
        </div>
        <Link className="button button-primary" href="/orders/new">
          <Plus size={17} /> Add order
        </Link>
      </header>
      <section className="stats">
        {stats.map(({ label, value, caption, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <span className="stat-icon">
                <Icon size={17} />
              </span>
            </div>
            <div className="stat-number">{value}</div>
            <div className="stat-caption">{caption}</div>
          </div>
        ))}
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Recent orders</h2>
            <p>Latest activity from your shop</p>
          </div>
          <Link className="button button-secondary button-small" href="/orders">
            View all
          </Link>
        </div>
        {recent.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Order details</th>
                  <th>Payment</th>
                  <th>Due date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <ClickableTableRow key={order.id} href={`/orders/${order.id}`}>
                    <td data-label="Order">
                      <span className="table-link">#{order.orderNumber}</span>
                    </td>
                    <td data-label="Customer">
                      <strong>{order.customerName}</strong>
                    </td>
                    <td data-label="Order details">
                      <StatusBadge value={order.orderStatus} />
                    </td>
                    <td data-label="Payment">
                      <StatusBadge value={order.paymentStatus} />
                    </td>
                    <td data-label="Due date">{formatDate(order.dueDate)}</td>
                    <td data-label="Amount">{formatMoney(order.totalAmount)}</td>
                  </ClickableTableRow>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <ClipboardCheck size={28} />
            <strong>No orders yet</strong>Create your first workshop order to get started.
          </div>
        )}
      </section>
    </>
  );
}
