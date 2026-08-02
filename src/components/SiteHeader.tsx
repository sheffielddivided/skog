"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Forside" },
  { href: "/norge", label: "Norge" },
  { href: "/verden", label: "Verden" },
  { href: "/sammenlikning", label: "Sammenlikning" },
  { href: "/forklaringer", label: "Forklaringer" },
  { href: "/kilder", label: "Data & kilder" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-paper-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-wide items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Skogens utvikling – forside">
          <span aria-hidden className="text-2xl leading-none">🌲</span>
          <span className="font-serif text-lg font-semibold tracking-tight">
            Skogens utvikling
          </span>
        </Link>

        <nav className="hidden md:block" aria-label="Hovedmeny">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    isActive(item.href)
                      ? "bg-forest-700 text-paper"
                      : "text-ink-soft hover:bg-paper-sunk hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="rounded-md border border-paper-line px-3 py-1.5 text-sm md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          Meny
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-paper-line bg-paper md:hidden" aria-label="Mobilmeny">
          <ul className="mx-auto flex max-w-wide flex-col px-4 py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`block rounded-md px-3 py-2.5 text-sm ${
                    isActive(item.href) ? "bg-paper-sunk font-medium text-ink" : "text-ink-soft"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
