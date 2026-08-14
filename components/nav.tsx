"use client";

import {
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  Settings,
  Users,
} from "lucide-react";
import Link, { useLinkStatus } from "next/link";
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
export function Navigation({
  worker = false,
  mobile = false,
}: {
  worker?: boolean;
  mobile?: boolean;
}) {
  const path = usePathname();
  const links = worker ? workerLinks : ownerLinks;
  return (
    <nav className={mobile ? "mobile-nav" : "nav"}>
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          className={path === href || path.startsWith(`${href}/`) ? "nav-link active" : "nav-link"}
          href={href}
        >
          <Icon size={mobile ? 19 : 18} />
          <span>{label}</span>
          <NavigationPending />
        </Link>
      ))}
    </nav>
  );
}

function NavigationPending() {
  const { pending } = useLinkStatus();
  return pending ? <LoaderCircle className="spinner nav-spinner" size={14} /> : null;
}
