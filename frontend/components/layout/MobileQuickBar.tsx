"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  CalendarCheck,
  Money,
  FileText,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface QuickNavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const QUICK_NAV_ITEMS: QuickNavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: SquaresFour,
  },
  {
    name: "Attendance",
    href: "/work-records",
    icon: CalendarCheck,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: Money,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
];

export function MobileQuickBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-lg"
    >
      <div className="grid grid-cols-4 items-center h-14 max-w-lg mx-auto px-2">
        {QUICK_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-full min-h-[44px] rounded-lg transition-colors group relative",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              {/* Active top pill indicator */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-1 w-6 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                />
              )}
              <Icon
                size={20}
                weight={isActive ? "fill" : "regular"}
                className={cn(
                  "transition-transform group-active:scale-90",
                  isActive ? "scale-105" : ""
                )}
              />
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[70px]">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileQuickBar;
