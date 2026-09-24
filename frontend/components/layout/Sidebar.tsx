"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Users,
  CalendarCheck,
  Money,
  FileText,
  ShieldCheck,
  SignOut,
  X,
  Building,
  UserGear,
  ShieldStar,
  GearSix,
} from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { COMPANY_SHORT, SYSTEM_NAME } from "@/lib/constants";

interface NavEntry {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const NAVIGATION_ITEMS: NavEntry[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: SquaresFour,
    roles: ["CEO", "ADMIN", "MANAGER"],
  },
  {
    name: "Employees",
    href: "/employees",
    icon: Users,
    roles: ["CEO", "ADMIN", "MANAGER"],
  },
  {
    name: "Work Records",
    href: "/work-records",
    icon: CalendarCheck,
    roles: ["CEO", "ADMIN", "MANAGER"],
  },
  {
    name: "Payments",
    href: "/payments",
    icon: Money,
    roles: ["CEO", "ADMIN"],
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
    roles: ["CEO", "MANAGER"],
  },
  {
    name: "Accounts",
    href: "/accounts",
    icon: UserGear,
    roles: ["CEO"],
  },
  {
    name: "Roles",
    href: "/roles",
    icon: ShieldStar,
    roles: ["CEO", "ADMIN", "MANAGER"],
  },
  {
    name: "Audit Logs",
    href: "/audit-logs",
    icon: ShieldCheck,
    roles: ["CEO"],
  },
  {
    name: "Settings",
    href: "/settings",
    icon: GearSix,
    roles: ["CEO", "ADMIN"],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll on mobile when sidebar drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold shadow-xs">
            <Building size={20} weight="bold" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {COMPANY_SHORT} Payroll
            </span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 -mt-0.5 truncate max-w-[140px]">
              Sepakat Silaturrahim
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation sidebar"
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav
        aria-label="Sidebar Navigation"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
      >
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Main Menu
        </div>
        {NAVIGATION_ITEMS.filter((item) => {
          if (!item.roles || !user?.role) return true;
          return item.roles.includes(user.role);
        }).map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <Icon
                size={20}
                weight={isActive ? "fill" : "regular"}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                )}
              />
              <span className="flex-1">{item.name}</span>
              {isActive && (
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile and Logout Pill */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2">
          <Link
            href="/profile"
            onClick={onClose}
            title="Manage profile and password"
            className="flex items-center gap-2.5 min-w-0 flex-1 group hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden border border-emerald-300 dark:border-emerald-700">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : user?.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                "U"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {user?.name || "System User"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold tracking-wide uppercase rounded bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {user?.role || "CEO"}
                </span>
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => logout()}
            title="Log out of account"
            aria-label="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <SignOut size={18} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className="hidden lg:block fixed inset-y-0 left-0 z-30 w-[260px]"
        aria-label="Desktop Sidebar"
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Mobile Slide-Out Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] max-w-[85vw] lg:hidden transform transition-transform duration-200 ease-in-out shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
      >
        {navContent}
      </div>
    </>
  );
}

export default Sidebar;
