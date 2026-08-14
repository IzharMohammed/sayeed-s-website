import { eq } from "drizzle-orm";
import { KeyRound, ShieldCheck } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { shops } from "@/lib/db/schema";

export default async function SettingsPage() {
  const user = await requireOwner();
  const [shop] = await db.select().from(shops).where(eq(shops.id, user.shopId)).limit(1);
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">Settings</div>
          <h1>Shop settings</h1>
          <p>Account and access information.</p>
        </div>
      </header>
      <section className="panel form-panel">
        <div className="form-section">
          <h2>Shop details</h2>
          <div className="form-grid">
            <div className="field">
              <label>Shop name</label>
              <input className="input" value={shop.name} disabled />
            </div>
            <div className="field">
              <label>Shop login code</label>
              <input className="input" value={shop.code} disabled />
            </div>
          </div>
        </div>
        <div className="form-section">
          <h2>
            <ShieldCheck size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Security
          </h2>
          <p className="muted">
            Your Primary Owner account cannot be disabled. All account and work-status changes are
            recorded in the activity log.
          </p>
        </div>
        <div className="form-section">
          <h2>
            <KeyRound size={17} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Password changes
          </h2>
          <p className="muted">
            Password reset and forced first-login password changes are the next deployment task
            after email/SMS recovery details are agreed with the shop.
          </p>
        </div>
      </section>
    </>
  );
}
