"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Camera, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();

  // Hide nav on onboarding and sign-in pages
  if (pathname.includes("onboarding") || pathname.includes("sign-in") || pathname.includes("sign-up")) {
    return null;
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Plan", href: "/plan", icon: CalendarDays },
    { name: "Scan", href: "/tracker", icon: Camera },
    { name: "Chat", href: "/chat", icon: MessageSquare },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-forest/10 pb-safe pt-2 px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-12 transition-colors",
                isActive ? "text-vitality-d" : "text-muted hover:text-forest"
              )}
            >
              <Icon className={cn("w-6 h-6 mb-1", isActive && "fill-vitality-d/20")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
