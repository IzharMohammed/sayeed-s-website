"use client";

import { ClipboardList, LayoutDashboard, ListChecks, Settings, Users } from "lucide-react";
import { usePathname } from "next/navigation";

const ownerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/tasks", label: "Work status", icon: ListChecks },
  { href: "/team", label: "Team", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];
const workerLinks = [
  { href: "/tasks", label: "My work", icon: ListChecks },
  { href: "/orders", label: "Orders", icon: ClipboardList },
];
const adminLinks = [{ href: "/admin", label: "Shops", icon: Users }];

export function Navigation({
  worker = false,
  platformAdmin = false,
  mobile = false,
}: {
  worker?: boolean;
  platformAdmin?: boolean;
  mobile?: boolean;
}) {
  const path = usePathname();
  const links = platformAdmin ? adminLinks : worker ? workerLinks : ownerLinks;
  return (
    <nav className={mobile ? "mobile-nav" : "nav"}>
      {links.map(({ href, label, icon: Icon }) => (
        <a
          key={href}
          className={path === href || path.startsWith(`${href}/`) ? "nav-link active" : "nav-link"}
          href={href}
        >
          <Icon size={mobile ? 19 : 18} />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
