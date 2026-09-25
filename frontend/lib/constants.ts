export const COMPANY_NAME = "Sepakat Silaturrahim Enterprise";
export const COMPANY_SHORT = "SSE";
export const SYSTEM_NAME = "SSE Payroll Management System";
export const SYSTEM_DESCRIPTION = "Daily-rated employee attendance and payroll management";

export const NEXT_PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "";

export interface NavItem {
  label: string;
  href: string;
  iconName: string;
  description: string;
  roles?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    iconName: "ChartPieSlice",
    description: "Daily attendance overview and financial summary",
    roles: ["CEO", "ADMIN", "MANAGER"],
  },
  {
    label: "Employees",
    href: "/employees",
    iconName: "Users",
    description: "Employee directory and daily wage configuration",
    roles: ["CEO", "ADMIN", "MANAGER"],
  },
  {
    label: "Work Records",
    href: "/work-records",
    iconName: "CalendarCheck",
    description: "Daily attendance entries and stored salary tracking",
    roles: ["CEO", "ADMIN", "MANAGER"],
  },
  {
    label: "Payments",
    href: "/payments",
    iconName: "CreditCard",
    description: "Salary disbursement and partial payment allocation",
    roles: ["CEO", "ADMIN"],
  },
  {
    label: "Reports",
    href: "/reports",
    iconName: "FileText",
    description: "Monthly payroll statements and balance reports",
    roles: ["CEO", "MANAGER"],
  },
  {
    label: "Accounts",
    href: "/accounts",
    iconName: "UserGear",
    description: "Manage system user accounts and credentials",
    roles: ["CEO"],
  },
  {
    label: "Roles",
    href: "/roles",
    iconName: "ShieldStar",
    description: "System role definitions and access permissions matrix",
    roles: ["CEO", "ADMIN", "MANAGER"],
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    iconName: "ClockCounterClockwise",
    description: "Immutable history of system transactions",
    roles: ["CEO"],
  },
  {
    label: "Settings",
    href: "/settings",
    iconName: "GearSix",
    description: "Company details, theme, and system preferences",
    roles: ["CEO", "ADMIN"],
  },
];

export type RecordStatus = "PAID" | "UNPAID" | "STORED" | "PARTIALLY_PAID" | "VOID";

export interface StatusMeta {
  label: string;
  badgeClass: string;
  dotColor: string;
  description: string;
}

export const STATUS_CONFIG: Record<RecordStatus, StatusMeta> = {
  PAID: {
    label: "Paid",
    badgeClass: "badge-paid bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
    description: "Disbursement completed in full",
  },
  UNPAID: {
    label: "Unpaid",
    badgeClass: "badge-unpaid bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotColor: "bg-slate-400",
    description: "Attendance verified, pending payment",
  },
  STORED: {
    label: "Stored",
    badgeClass: "badge-stored bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    dotColor: "bg-amber-500",
    description: "Salary held as savings at worker request",
  },
  PARTIALLY_PAID: {
    label: "Partially Paid",
    badgeClass: "badge-partial bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
    dotColor: "bg-sky-500",
    description: "Partially disbursed across work record",
  },
  VOID: {
    label: "Void",
    badgeClass: "badge-void bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    dotColor: "bg-rose-400",
    description: "Marked absent or voided by administrator",
  },
};
