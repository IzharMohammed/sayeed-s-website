import { Hammer } from "lucide-react";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user)
    redirect(
      user.role === "PLATFORM_ADMIN" ? "/admin" : user.role === "WORKER" ? "/tasks" : "/dashboard",
    );
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
            Every order.
            <br />
            Every stage.
            <br />
            One simple place.
          </h1>
          <p>
            Move your workshop from paper registers to an easy, reliable work tracker built for
            owners and workers.
          </p>
        </div>
        <small>Made for busy workshops</small>
      </section>
      <section className="auth-panel">
        <form action={loginAction} className="auth-form">
          <div className="eyebrow">Welcome back</div>
          <h2>Sign in to your shop</h2>
          <p>Use the details given by your shop owner.</p>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label htmlFor="shopCode">Shop code</label>
            <input
              className="input"
              id="shopCode"
              name="shopCode"
              placeholder="Example: KHALID01"
              required
              autoCapitalize="characters"
            />
            <span className="hint">Platform administrator uses ADMIN.</span>
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              className="input"
              id="username"
              name="username"
              placeholder="Your username"
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
              placeholder="Minimum 8 characters"
              required
              autoComplete="current-password"
            />
          </div>
          <SubmitButton className="button button-primary button-block" pendingLabel="Signing in…">
            Sign in
          </SubmitButton>
        </form>
      </section>
    </main>
  );
}
