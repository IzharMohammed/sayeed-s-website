import { asc, isNotNull } from "drizzle-orm";
import { Building2, Store, UserPlus, UsersRound } from "lucide-react";
import { createShopAction } from "@/app/actions/admin";
import { StatusBadge } from "@/components/status-badge";
import { requirePlatformAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await requirePlatformAdmin();
  const { error, success } = await searchParams;
  const [shopRows, memberRows] = await Promise.all([
    db.select().from(shops).orderBy(asc(shops.createdAt)),
    db
      .select({ shopId: users.shopId, role: users.role, active: users.active })
      .from(users)
      .where(isNotNull(users.shopId)),
  ]);

  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">Platform administration</div>
          <h1>Customer shops</h1>
          <p>Create each shop and give its first owner access.</p>
        </div>
      </header>

      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      <section className="stats">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total shops</span>
            <span className="stat-icon">
              <Store size={17} />
            </span>
          </div>
          <div className="stat-number">{shopRows.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <span>Shop owners</span>
            <span className="stat-icon">
              <UsersRound size={17} />
            </span>
          </div>
          <div className="stat-number">
            {memberRows.filter((member) => member.role === "OWNER" && member.active).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-top">
            <span>Workers</span>
            <span className="stat-icon">
              <UsersRound size={17} />
            </span>
          </div>
          <div className="stat-number">
            {memberRows.filter((member) => member.role === "WORKER" && member.active).length}
          </div>
        </div>
      </section>

      <div className="team-layout admin-layout">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Registered shops</h2>
              <p>Isolated customer workspaces</p>
            </div>
            <Building2 size={19} className="muted" />
          </div>
          {shopRows.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Shop</th>
                    <th>Login code</th>
                    <th>Owners</th>
                    <th>Workers</th>
                    <th>Created</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shopRows.map((shop) => {
                    const members = memberRows.filter((member) => member.shopId === shop.id);
                    return (
                      <tr key={shop.id}>
                        <td data-label="Shop">
                          <strong>{shop.name}</strong>
                        </td>
                        <td data-label="Login code">{shop.code}</td>
                        <td data-label="Owners">
                          {
                            members.filter((member) => member.role === "OWNER" && member.active)
                              .length
                          }
                        </td>
                        <td data-label="Workers">
                          {
                            members.filter((member) => member.role === "WORKER" && member.active)
                              .length
                          }
                        </td>
                        <td data-label="Created">{formatDate(shop.createdAt)}</td>
                        <td data-label="Status">
                          <StatusBadge value="ACTIVE" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              <Store size={28} />
              <strong>No customer shops yet</strong>
              Use the form to create the first shop and owner.
            </div>
          )}
        </section>

        <section className="panel" style={{ alignSelf: "start" }}>
          <div className="panel-header">
            <div>
              <h2>Add customer shop</h2>
              <p>Also creates its first Owner</p>
            </div>
            <UserPlus size={19} className="muted" />
          </div>
          <form action={createShopAction} className="form-section">
            <div className="field">
              <label>Shop name</label>
              <input className="input" name="shopName" placeholder="Khalid Glass Works" required />
            </div>
            <div className="field">
              <label>Shop login code</label>
              <input className="input" name="shopCode" placeholder="KHALID01" required />
            </div>
            <div className="field">
              <label>First owner name</label>
              <input className="input" name="ownerName" required />
            </div>
            <div className="field">
              <label>Owner username</label>
              <input className="input" name="username" minLength={3} required />
            </div>
            <div className="field">
              <label>Temporary password</label>
              <input className="input" name="password" type="password" minLength={8} required />
              <span className="hint">Share this securely with the shop owner.</span>
            </div>
            <button className="button button-primary button-block">Create shop access</button>
          </form>
        </section>
      </div>
    </>
  );
}
