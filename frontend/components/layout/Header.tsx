"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, CalendarBlank, CaretRight } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  title?: string;
  onOpenMobileSidebar: () => void;
}

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/employees": "Employees",
  "/work-records": "Work Records",
  "/payments": "Payments",
  "/reports": "Reports",
  "/audit-logs": "Audit Logs",
};

export function Header({ title, onOpenMobileSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Page title derived from prop or pathname
  const currentTitle = useMemo(() => {
    if (title) return title;
    if (pathname && ROUTE_TITLES[pathname]) {
      return ROUTE_TITLES[pathname];
    }
    const match = Object.keys(ROUTE_TITLES).find(
      (route) => route !== "/dashboard" && pathname?.startsWith(route)
    );
    return match ? ROUTE_TITLES[match] : "Dashboard";
  }, [title, pathname]);

  // Current date formatted in Malaysian locale format: "Khamis, 24 September 2026"
  const formattedDate = useMemo(() => {
    try {
      const now = new Date();
      return new Intl.DateTimeFormat("ms-MY", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now);
    } catch {
      return new Date().toLocaleDateString("en-MY", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        {/* Mobile menu hamburger toggle */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar menu"
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <List size={22} weight="bold" />
        </button>

        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-2">
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center text-xs text-slate-400 dark:text-slate-500">
            <Link
              href="/dashboard"
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              SSEP
            </Link>
            <CaretRight size={12} weight="bold" className="mx-1 text-slate-300 dark:text-slate-600" />
          </nav>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Right side: formatted date and executive badge */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Malaysian / English formatted date */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
          <CalendarBlank size={15} weight="bold" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium whitespace-nowrap">{formattedDate}</span>
        </div>

        {/* User indicator for quick visual check */}
        {user && (
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {user.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
