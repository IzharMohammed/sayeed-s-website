import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft, ImageIcon, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  deleteOrderAction,
  updateDeliveryAction,
  updateOrderAction,
  updateStageAction,
} from "@/app/actions/orders";
import { ImageUploader } from "@/components/image-uploader";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { requireShopUser } from "@/lib/auth";
import {
  DELIVERY_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  WORK_STATUSES,
  label,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { attachments, orderItems, orders, workStages } from "@/lib/db/schema";
import { formatDate, formatMoney } from "@/lib/format";
import { getR2Client } from "@/lib/r2";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireShopUser();
  const { id } = await params;
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.shopId, user.shopId)))
    .limit(1);
  if (!order) notFound();
  const [items, stages, files] = await Promise.all([
    db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(orderItems.serialNumber)),
    db
      .select({ stage: workStages, itemId: orderItems.id })
      .from(workStages)
      .innerJoin(orderItems, eq(workStages.orderItemId, orderItems.id))
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(workStages.stage)),
    db
      .select({ file: attachments, itemId: orderItems.id })
      .from(attachments)
      .innerJoin(orderItems, eq(attachments.orderItemId, orderItems.id))
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(attachments.createdAt)),
  ]);
  const fileUrls = new Map<string, { file: typeof attachments.$inferSelect; url: string }[]>();
  if (process.env.R2_BUCKET_NAME && process.env.R2_ACCOUNT_ID) {
    await Promise.all(
      files.map(async ({ file, itemId }) => {
        const url = await getSignedUrl(
          getR2Client(),
          new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: file.objectKey }),
          { expiresIn: 1800 },
        );
        fileUrls.set(itemId, [...(fileUrls.get(itemId) ?? []), { file, url }]);
      }),
    );
  }
  return (
    <>
      <header className="page-header">
        <div>
          <Link
            href="/orders"
            className="muted"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 13,
              marginBottom: 9,
            }}
          >
            <ArrowLeft size={14} /> All orders
          </Link>
          <h1>Order #{order.orderNumber}</h1>
          <p>
            {order.customerName} · Created {formatDate(order.createdAt)}
          </p>
        </div>
        {user.role !== "WORKER" && (
          <form action={deleteOrderAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <SubmitButton className="button button-danger button-small" pendingLabel="Deleting…">
              <Trash2 size={15} /> Delete
            </SubmitButton>
          </form>
        )}
      </header>
      <section
        className="stats"
        style={{
          gridTemplateColumns:
            user.role === "OWNER" ? "repeat(4,minmax(0,1fr))" : "repeat(2,minmax(0,1fr))",
        }}
      >
        <div className="stat-card">
          <div className="stat-top">Order details</div>
          <div style={{ marginTop: 15 }}>
            <StatusBadge value={order.orderStatus} />
          </div>
        </div>
        {user.role === "OWNER" && (
          <>
            <div className="stat-card">
              <div className="stat-top">Payment details</div>
              <div style={{ marginTop: 15 }}>
                <StatusBadge value={order.paymentStatus} />
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-top">Total amount</div>
              <div className="stat-number" style={{ fontSize: 21 }}>
                {formatMoney(order.totalAmount)}
              </div>
            </div>
          </>
        )}
        <div className="stat-card">
          <div className="stat-top">Due date</div>
          <div className="stat-number" style={{ fontSize: 21 }}>
            {formatDate(order.dueDate)}
          </div>
        </div>
      </section>
      {user.role === "OWNER" && (
        <details className="panel" style={{ marginBottom: 18 }}>
          <summary className="panel-header" style={{ cursor: "pointer", fontWeight: 750 }}>
            Edit customer, order and payment details
          </summary>
          <form action={updateOrderAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <div className="form-section form-grid">
              <div className="field">
                <label>Customer name</label>
                <input
                  className="input"
                  name="customerName"
                  defaultValue={order.customerName}
                  required
                />
              </div>
              <div className="field">
                <label>Phone number</label>
                <input
                  className="input"
                  name="customerPhone"
                  defaultValue={order.customerPhone ?? ""}
                />
              </div>
              <div className="field">
                <label>Order details</label>
                <select className="select" name="orderStatus" defaultValue={order.orderStatus}>
                  {ORDER_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {label(value)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Payment details</label>
                <select className="select" name="paymentStatus" defaultValue={order.paymentStatus}>
                  {PAYMENT_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {label(value)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Total amount</label>
                <input
                  className="input"
                  name="totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={order.totalAmount ?? ""}
                />
              </div>
              <div className="field">
                <label>Advance amount</label>
                <input
                  className="input"
                  name="advanceAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={order.advanceAmount ?? ""}
                />
              </div>
              <div className="field">
                <label>Due date</label>
                <input
                  className="input"
                  name="dueDate"
                  type="date"
                  defaultValue={order.dueDate ? order.dueDate.toISOString().slice(0, 10) : ""}
                />
              </div>
              <div className="field">
                <label>Remarks</label>
                <input className="input" name="remarks" defaultValue={order.remarks ?? ""} />
              </div>
            </div>
            <div className="form-actions">
              <SubmitButton className="button button-primary" pendingLabel="Saving order…">
                Save order details
              </SubmitButton>
            </div>
          </form>
        </details>
      )}
      <div style={{ display: "grid", gap: 18 }}>
        {items.map((item) => {
          const itemStages = stages.filter((value) => value.itemId === item.id);
          const itemFiles = fileUrls.get(item.id) ?? [];
          return (
            <section className="panel" key={item.id}>
              <div className="panel-header">
                <div>
                  <h2>
                    Item {item.serialNumber}: {item.description}
                  </h2>
                  <p>
                    {item.height} × {item.width} {item.measurementUnit} · {item.pieces} pieces ·{" "}
                    {item.thickness} {item.material}
                  </p>
                </div>
                <ImageUploader orderItemId={item.id} />
              </div>
              {itemFiles.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: 14,
                    overflowX: "auto",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  {itemFiles.map(({ file, url }) => (
                    <a href={url} target="_blank" rel="noreferrer" key={file.id}>
                      {/* Signed private R2 images intentionally bypass the Next.js image proxy. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={file.originalName}
                        width={118}
                        height={84}
                        style={{
                          width: 118,
                          height: 84,
                          objectFit: "cover",
                          borderRadius: 10,
                          border: "1px solid var(--line)",
                        }}
                      />
                    </a>
                  ))}
                </div>
              )}
              {itemFiles.length === 0 && (
                <div
                  style={{
                    padding: "13px 18px",
                    color: "var(--muted)",
                    fontSize: 12,
                    display: "flex",
                    gap: 7,
                    alignItems: "center",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <ImageIcon size={15} /> No reference photos uploaded
                </div>
              )}
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Status</th>
                      <th>Change status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemStages.map(({ stage }) => (
                      <tr key={stage.id}>
                        <td data-label="Stage">
                          <strong>{label(stage.stage)}</strong>
                        </td>
                        <td data-label="Status">
                          <StatusBadge value={stage.status} />
                        </td>
                        <td data-label="Change">
                          <form action={updateStageAction} style={{ display: "flex", gap: 8 }}>
                            <input type="hidden" name="stageId" value={stage.id} />
                            <select
                              className="status-select"
                              name="status"
                              defaultValue={stage.status}
                            >
                              {WORK_STATUSES.map((value) => (
                                <option key={value} value={value}>
                                  {label(value)}
                                </option>
                              ))}
                            </select>
                            <SubmitButton
                              className="button button-secondary button-small"
                              pendingLabel="Saving…"
                            >
                              Save
                            </SubmitButton>
                          </form>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td data-label="Stage">
                        <strong>Delivery</strong>
                      </td>
                      <td data-label="Status">
                        <StatusBadge value={item.deliveryStatus} />
                      </td>
                      <td data-label="Change">
                        <form action={updateDeliveryAction} style={{ display: "flex", gap: 8 }}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <select
                            className="status-select"
                            name="status"
                            defaultValue={item.deliveryStatus}
                          >
                            {DELIVERY_STATUSES.map((value) => (
                              <option key={value} value={value}>
                                {label(value)}
                              </option>
                            ))}
                          </select>
                          <SubmitButton
                            className="button button-secondary button-small"
                            pendingLabel="Saving…"
                          >
                            Save
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
