import { KeyRound } from "lucide-react";
import { redirect } from "next/navigation";
import { changePasswordAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.mustChangePassword) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="auth-panel">
      <form action={changePasswordAction} className="auth-form">
        <span className="brand-icon" style={{ marginBottom: 24 }}>
          <KeyRound size={20} />
        </span>
        <div className="eyebrow">Secure your account</div>
        <h2>Choose your password</h2>
        <p>Replace the temporary password given to you by the owner.</p>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label htmlFor="password">New password</label>
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
          <label htmlFor="confirmPassword">Confirm new password</label>
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
        <button className="button button-primary button-block">Save password</button>
      </form>
    </main>
  );
}
