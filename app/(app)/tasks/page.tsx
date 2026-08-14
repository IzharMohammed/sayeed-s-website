import { asc, eq } from "drizzle-orm";
import { ListChecks } from "lucide-react";
import { updateDeliveryAction, updateStageAction } from "@/app/actions/orders";
import { StatusBadge } from "@/components/status-badge";
import { requireShopUser } from "@/lib/auth";
import { DELIVERY_STATUSES, WORK_STATUSES, label } from "@/lib/constants";
import { db } from "@/lib/db";
import { orderItems, orders, workStages } from "@/lib/db/schema";

export default async function TasksPage() {
  const user = await requireShopUser();
  const rows = await db
    .select({ item: orderItems, order: orders, stage: workStages })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(workStages, eq(workStages.orderItemId, orderItems.id))
    .where(eq(orders.shopId, user.shopId))
    .orderBy(asc(orders.orderNumber), asc(orderItems.serialNumber), asc(workStages.stage));
  const grouped = new Map<
    string,
    {
      item: typeof orderItems.$inferSelect;
      order: typeof orders.$inferSelect;
      stages: (typeof workStages.$inferSelect)[];
    }
  >();
  for (const row of rows) {
    const current = grouped.get(row.item.id) ?? { item: row.item, order: row.order, stages: [] };
    current.stages.push(row.stage);
    grouped.set(row.item.id, current);
  }
  const tasks = [...grouped.values()].filter(
    ({ item, order }) => order.orderStatus !== "CANCELLED" && item.deliveryStatus !== "DELIVERED",
  );
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">Workshop</div>
          <h1>{user.role === "WORKER" ? "My work" : "Work status"}</h1>
          <p>Update a stage as soon as the work changes.</p>
        </div>
      </header>
      {tasks.length ? (
        <div className="task-grid">
          {tasks.map(({ item, order, stages }) => (
            <article className="task-card" key={item.id}>
              <div className="task-card-head">
                <div>
                  <strong>
                    #{order.orderNumber} · {item.description}
                  </strong>
                  <span>
                    {order.customerName} · Item {item.serialNumber}
                  </span>
                </div>
                <StatusBadge value={order.orderStatus} />
              </div>
              <div className="task-specs">
                <div>
                  <span>Size</span>
                  <strong>
                    {item.height} × {item.width}
                  </strong>
                </div>
                <div>
                  <span>Material</span>
                  <strong>{item.material}</strong>
                </div>
                <div>
                  <span>Pieces</span>
                  <strong>
                    {item.pieces} · {item.thickness}
                  </strong>
                </div>
              </div>
              <div className="stage-list">
                {stages.map((stage) => (
                  <form action={updateStageAction} className="stage-row" key={stage.id}>
                    <input type="hidden" name="stageId" value={stage.id} />
                    <span className="stage-name">{label(stage.stage)}</span>
                    <select
                      aria-label={`${label(stage.stage)} status`}
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
                    <button className="button button-secondary button-small">Save</button>
                  </form>
                ))}
                <form action={updateDeliveryAction} className="stage-row">
                  <input type="hidden" name="itemId" value={item.id} />
                  <span className="stage-name">Delivery</span>
                  <select
                    aria-label="Delivery status"
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
                  <button className="button button-secondary button-small">Save</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel empty">
          <ListChecks size={30} />
          <strong>All work is complete</strong>There are no active workshop items right now.
        </div>
      )}
    </>
  );
}
