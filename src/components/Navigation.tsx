"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Camera, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { name: "Home", href: "/",        icon: Home },
  { name: "Plan", href: "/plan",    icon: CalendarDays },
  { name: "Scan", href: "/tracker", icon: Camera },
  { name: "Chat", href: "/chat",    icon: MessageSquare },
];

export function Navigation() {
  const pathname = usePathname();

  if (pathname.includes("onboarding") || pathname.includes("sign-in") || pathname.includes("sign-up")) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-warm-white/90 backdrop-blur-md border-t border-forest/10 shadow-[0_-2px_16px_rgba(13,31,15,0.04)]"
      aria-label="Primary"
    >
      <div className="max-w-md mx-auto px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <ul className="flex items-center justify-around">
          {NAV.map(({ name, href, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={name}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl transition-brand",
                    active ? "text-forest" : "text-muted hover:text-forest"
                  )}
                >
                  <div
                    className={cn(
                      "grid place-items-center w-9 h-7 rounded-full transition-brand",
                      active && "bg-vitality"
                    )}
                  >
                    <Icon className={cn("w-[18px] h-[18px]", active && "text-forest")} strokeWidth={active ? 2.4 : 2} />
                  </div>
                  <span className={cn("text-[10px] tracking-wide", active ? "font-semibold text-forest" : "font-medium")}>
                    {name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
