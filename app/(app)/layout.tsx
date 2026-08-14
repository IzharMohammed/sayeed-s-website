import { Hammer, LogOut, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Navigation } from "@/components/nav";
import { InstallAppButton } from "@/components/install-app-button";
import { SubmitButton } from "@/components/submit-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth";
import { label } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  const worker = user.role === "WORKER";
  const home = worker ? "/tasks" : "/dashboard";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href={home} className="brand-mark">
          <span className="brand-icon">
            <Hammer size={20} />
          </span>
          Karigar
        </Link>
        <Navigation worker={worker} />
        <div className="sidebar-footer">
          <div className="user-block">
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{label(user.role)}</span>
            </div>
          </div>
          <form action={logoutAction}>
            <SubmitButton
              className="button button-secondary button-small button-block"
              pendingLabel="Signing out…"
            >
              <LogOut size={15} /> Sign out
            </SubmitButton>
          </form>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <Link href={home} className="mobile-logo brand-mark">
            <span className="brand-icon">
              <Hammer size={18} />
            </span>
            Karigar
          </Link>
          <div className="topbar-actions">
            <InstallAppButton />
            {!worker && (
              <Link href="/orders/new" className="button button-primary button-small">
                <Plus size={16} /> New order
              </Link>
            )}
            <ThemeToggle />
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
      <Navigation worker={worker} mobile />
    </div>
  );
}
