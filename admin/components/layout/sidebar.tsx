"use client"

import { useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  Megaphone,
  History,
  Settings,
  Newspaper,
  DollarSign,
  Users,
  Car,
  Sun,
  Moon,
  ChevronDown,
  MessageCircle,
} from "lucide-react"

type NavItem = { href: string; label: string; icon: React.ElementType }

const topItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/facebook", label: "Facebook", icon: MessageCircle },
]

const campaignItems: NavItem[] = [
  { href: "/campaigns", label: "Campaigns", icon: Newspaper },
  { href: "/campaigns/history", label: "History", icon: History },
]

const pricingItems: NavItem[] = [
  { href: "/pricing", label: "Pricing", icon: DollarSign },
]

const leadsItems: NavItem[] = [
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/bookings", label: "Bookings", icon: Car },
]

const bottomItems: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
]

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/")
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <item.icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  )
}

function SidebarContent({ pathname }: { pathname: string }) {
  const [groupOpen, setGroupOpen] = useState(true)
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const groupActive = campaignItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  )

  return (
    <>
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          A
        </div>
        <span className="font-semibold text-sidebar-foreground">
          Fleetops
        </span>
      </div>
      <Separator />
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {topItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        <div>
          <button
            onClick={() => setGroupOpen(!groupOpen)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              groupActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Megaphone className="size-4 shrink-0" />
            Campaigns
            <ChevronDown className={cn("ml-auto size-3.5 transition-transform", groupOpen && "rotate-180")} />
          </button>
          {groupOpen && (
            <div className="ml-3 space-y-0.5 border-l border-border pl-2">
              {campaignItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="size-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-1 border-t border-border pt-1">
          {pricingItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {leadsItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {bottomItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="border-t p-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {mounted ? (theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />) : <Sun className="size-4" />}
          {mounted ? (theme === "dark" ? "Light Mode" : "Dark Mode") : "Light Mode"}
        </button>
      </div>
    </>
  )
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
      <SidebarContent pathname={pathname} />
    </aside>
  )
}
