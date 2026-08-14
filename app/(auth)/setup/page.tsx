import { count } from "drizzle-orm";
import { Hammer, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { setupAction } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [result] = await db.select({ count: count() }).from(users);
  if (result.count > 0) redirect("/login");
  const { error } = await searchParams;
  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="brand-mark">
          <span className="brand-icon">
            <Hammer size={21} />
          </span>
          Karigar
        </div>
        <div>
          <h1>
            Let’s set up
            <br />
            your workshop.
          </h1>
          <p>This protected page creates the first Owner. It automatically closes after setup.</p>
        </div>
        <small>
          <ShieldCheck size={15} /> One-time secure setup
        </small>
      </section>
      <section className="auth-panel">
        <form action={setupAction} className="auth-form">
          <div className="eyebrow">First-time setup</div>
          <h2>Create the first Owner</h2>
          <p>This account has full access and can add more Owners or Workers.</p>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label htmlFor="token">Private setup token</label>
            <input className="input" id="token" name="token" type="password" required />
          </div>
          <div className="field">
            <label htmlFor="shopName">Workshop name</label>
            <input className="input" id="shopName" name="shopName" required />
          </div>
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input className="input" id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              className="input"
              id="username"
              name="username"
              required
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              className="input"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          <SubmitButton
            className="button button-primary button-block"
            pendingLabel="Creating owner…"
          >
            Create Owner account
          </SubmitButton>
        </form>
      </section>
    </main>
  );
}
