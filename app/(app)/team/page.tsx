import { asc, eq } from "drizzle-orm";
import { UserPlus, UsersRound } from "lucide-react";
import { createMemberAction, toggleMemberAction } from "@/app/actions/team";
import { StatusBadge } from "@/components/status-badge";
import { requireOwner } from "@/lib/auth";
import { label } from "@/lib/constants";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const actor = await requireOwner();
  const { error, success } = await searchParams;
  const members = await db
    .select()
    .from(users)
    .where(eq(users.shopId, actor.shopId))
    .orderBy(asc(users.createdAt));
  const workerCount = members.filter((member) => member.role === "WORKER" && member.active).length;
  const ownerCount = members.filter((member) => member.role !== "WORKER" && member.active).length;
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">People</div>
          <h1>Team members</h1>
          <p>
            {ownerCount} owners and {workerCount} active workers.
          </p>
        </div>
      </header>
      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.5fr) minmax(300px,.7fr)",
          gap: 18,
        }}
        className="team-layout"
      >
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Everyone</h2>
              <p>Owner and worker access</p>
            </div>
            <UsersRound size={19} className="muted" />
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last login</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td data-label="Name">
                      <strong>{member.name}</strong>
                    </td>
                    <td data-label="Username">@{member.username}</td>
                    <td data-label="Role">{label(member.role)}</td>
                    <td data-label="Status">
                      <StatusBadge value={member.active ? "ACTIVE" : "DISABLED"} />
                    </td>
                    <td data-label="Last login">{formatDate(member.lastLoginAt)}</td>
                    <td data-label="Action">
                      {member.id !== actor.id ? (
                        <form action={toggleMemberAction}>
                          <input type="hidden" name="userId" value={member.id} />
                          <button
                            className={`button button-small ${member.active ? "button-danger" : "button-secondary"}`}
                          >
                            {member.active ? "Disable" : "Enable"}
                          </button>
                        </form>
                      ) : (
                        <span className="muted">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel" style={{ alignSelf: "start" }}>
          <div className="panel-header">
            <div>
              <h2>Add team member</h2>
              <p>They can sign in immediately</p>
            </div>
            <UserPlus size={19} className="muted" />
          </div>
          <form action={createMemberAction} className="form-section">
            <div className="field">
              <label>Full name</label>
              <input className="input" name="name" required />
            </div>
            <div className="field">
              <label>Username</label>
              <input className="input" name="username" minLength={3} required />
            </div>
            <div className="field">
              <label>Temporary password</label>
              <input className="input" name="password" type="password" minLength={8} required />
              <span className="hint">Minimum 8 characters.</span>
            </div>
            <div className="field">
              <label>Role</label>
              <select className="select" name="role">
                <option value="WORKER">Worker</option>
                <option value="OWNER">Owner</option>
              </select>
            </div>
            <button className="button button-primary button-block">Create account</button>
          </form>
        </section>
      </div>
    </>
  );
}
