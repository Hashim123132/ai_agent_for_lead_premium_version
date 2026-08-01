'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';

const landingLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Pricing', href: '#pricing' },
];

const appLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Campaigns', href: '/campaigns' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Leads', href: '/leads' },
  { label: 'Settings', href: '/settings' },
];

export default function Navbar({
  variant = 'landing',
}: {
  variant?: 'landing' | 'app';
}) {
  const isApp = variant === 'app';
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const links = isApp ? appLinks : landingLinks;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const headerClass = isApp
    ? 'sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl shadow-sm'
    : `fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-border/40 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-sm'
          : 'bg-white/80 backdrop-blur-lg'
      }`;

  return (
    <header className={headerClass}>
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
          FleetOps
          <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
            Beta
          </span>
        </Link>

        {/* Desktop nav links (center-right) */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) =>
            isApp ? (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        {/* Desktop CTA + Mobile hamburger */}
        <div className="flex items-center gap-4">
          {isApp ? (
            <Link
              href="/"
              className="hidden md:inline-flex items-center bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-all"
            >
              Back to Website
            </Link>
          ) : (
            <a
              href="#demo"
              className="hidden md:inline-flex items-center bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-all"
            >
              Request Demo
            </a>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button
                className="p-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">FleetOps</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-4">
                {links.map((link) => (
                  <SheetClose asChild key={link.label}>
                    {isApp ? (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-md hover:bg-muted"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-md hover:bg-muted"
                      >
                        {link.label}
                      </a>
                    )}
                  </SheetClose>
                ))}
                <div className="mt-4 space-y-2">
                  <SheetClose asChild>
                    {isApp ? (
                      <Link
                        href="/"
                        className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all"
                      >
                        Back to Website
                      </Link>
                    ) : (
                      <a
                        href="#demo"
                        className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all"
                      >
                        Request Demo
                      </a>
                    )}
                  </SheetClose>
                  {isApp && (
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      {mounted && theme === 'dark' ? (
                        <Sun className="w-4 h-4" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )}
                      {mounted ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : 'Dark Mode'}
                    </button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
