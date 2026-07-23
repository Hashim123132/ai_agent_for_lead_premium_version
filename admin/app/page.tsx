import Link from "next/link";
import { LayoutDashboard, Newspaper, Users, DollarSign, Lightbulb } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Business metrics & overview" },
  { href: "/campaigns", label: "Campaigns", icon: Newspaper, desc: "Generate & manage campaigns" },
  { href: "/leads", label: "Leads", icon: Users, desc: "Find business partners" },
  { href: "/pricing", label: "Pricing", icon: DollarSign, desc: "Pricing recommendations" },
  { href: "/ad-suggestions", label: "Ad Suggestions", icon: Lightbulb, desc: "Discover ad inspiration" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
        B
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">BookFlow</h1>
      <p className="mt-1 text-sm text-muted-foreground">Booking & Campaign Management</p>
      <div className="mt-8 grid w-full max-w-lg gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-3 rounded-xl border p-4 text-sm transition-colors hover:bg-muted/50"
          >
            <l.icon className="size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">{l.label}</p>
              <p className="text-xs text-muted-foreground">{l.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
