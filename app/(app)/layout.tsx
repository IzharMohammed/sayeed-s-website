import { Hammer, LogOut, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Navigation } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth";
import { label } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  const platformAdmin = user.role === "PLATFORM_ADMIN";
  const worker = user.role === "WORKER";
  const home = platformAdmin ? "/admin" : worker ? "/tasks" : "/dashboard";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href={home} className="brand-mark">
          <span className="brand-icon">
            <Hammer size={20} />
          </span>
          Karigar
        </a>
        <Navigation worker={worker} platformAdmin={platformAdmin} />
        <div className="sidebar-footer">
          <div className="user-block">
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{label(user.role)}</span>
            </div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="button button-secondary button-small button-block">
              <LogOut size={15} /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <a href={home} className="mobile-logo brand-mark">
            <span className="brand-icon">
              <Hammer size={18} />
            </span>
            Karigar
          </a>
          <div className="topbar-actions">
            {!worker && !platformAdmin && (
              <Link href="/orders/new" className="button button-primary button-small">
                <Plus size={16} /> New order
              </Link>
            )}
            <ThemeToggle />
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
      <Navigation worker={worker} platformAdmin={platformAdmin} mobile />
    </div>
  );
}
