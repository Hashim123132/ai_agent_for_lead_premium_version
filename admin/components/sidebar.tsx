"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Megaphone,
  LayoutDashboard,
  Settings,
  Newspaper,
  History,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type NavGroup = {
  label: string;
  icon: React.ElementType;
  children: NavItem[];
};

const navGroups: (NavItem | NavGroup)[] = [
  {
    label: "Campaigns",
    icon: Megaphone,
    children: [
      { href: "/campaigns", label: "Generator", icon: Newspaper },
      { href: "/campaigns/history", label: "History", icon: History },
    ],
  },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "children" in item;
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          A
        </div>
        <span className="font-semibold text-sidebar-foreground">
          AppointFlow
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navGroups.map((item) => {
          if (isGroup(item)) {
            const groupActive = item.children.some(
              (child) =>
                pathname === child.href ||
                pathname.startsWith(child.href + "/"),
            );
            return (
              <div key={item.label} className="space-y-0.5">
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    groupActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </div>
                <div className="ml-3 space-y-0.5 border-l pl-2">
                  {item.children.map((child) => {
                    const childActive =
                      pathname === child.href ||
                      pathname.startsWith(child.href + "/");
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors",
                          childActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <child.icon className="size-3.5" />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
