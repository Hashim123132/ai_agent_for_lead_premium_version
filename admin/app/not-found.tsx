import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-background text-foreground relative">
      <div className="flex items-center gap-3 mb-8">
        <span className="w-3.5 h-3.5 rounded-full bg-[var(--color-emerald-accent)]" />
        <span className="text-lg font-semibold tracking-tight">FleetOps</span>
      </div>

      <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-emerald-accent)] mb-3">
        Error 404
      </p>
      <h1 className="text-7xl sm:text-8xl font-extrabold tracking-tight leading-none mb-4">
        Page not found
      </h1>
      <p className="text-muted-foreground max-w-md mb-10 text-pretty">
        The page you&apos;re looking for doesn&apos;t exist, was moved, or
        never made it into the fleet.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-medium transition-opacity hover:opacity-80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full border border-foreground/15 px-6 py-3 text-sm font-medium transition-colors hover:bg-foreground/5"
        >
          Go to dashboard
        </Link>
      </div>

      <p className="absolute bottom-6 text-xs text-muted-foreground/70">
        &copy; {new Date().getFullYear()} FleetOps. All rights reserved.
      </p>
    </div>
  );
}
