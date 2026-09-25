"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldStar,
  Users,
  CalendarCheck,
  CreditCard,
  FileText,
  ClockCounterClockwise,
  GearSix,
  CheckCircle,
  XCircle,
  Sparkle,
  UserGear,
  CircleNotch,
} from "@phosphor-icons/react";
import { userService } from "@/services/userService";
import { User } from "@/types/auth";

interface RoleCard {
  role: string;
  title: string;
  badgeColor: string;
  description: string;
  responsibilities: string[];
  accessLevel: string;
}

const SYSTEM_ROLES: RoleCard[] = [
  {
    role: "CEO",
    title: "Chief Executive Officer / Pengarah Urusan",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    description: "Highest system authority with full administrative, financial, auditing, and credential management control.",
    responsibilities: [
      "Full oversight of all employee daily rates and status",
      "Record and approve daily attendance entries",
      "Disburse salary payments and execute partial allocations",
      "Generate, print, and download official payment receipts",
      "View executive monthly statements and balance analytics",
      "Inspect immutable system audit trail and activity logs",
      "Manage user accounts: create, update, and remove system users",
      "Configure company operational and payroll settings",
    ],
    accessLevel: "Full Access (All Modules)",
  },
  {
    role: "ADMIN",
    title: "Site Supervisor / Pengurus Tapak",
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700",
    description: "Operational field lead managing worker roster, daily attendance logs, and preliminary payment entries.",
    responsibilities: [
      "Register new workers and maintain employee records",
      "Enter daily worker attendance and rate snapshots",
      "Mark attendance statuses: UNPAID, STORED, VOID",
      "Initiate salary disbursements and generate receipts",
      "View employee balances and stored wage accumulations",
      "Configure company preferences and profile information",
    ],
    accessLevel: "Operational Access (Daily Attendance & Payments)",
  },
  {
    role: "MANAGER",
    title: "Operations Manager / Pengurus Operasi",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-700",
    description: "Management authority supervising daily attendance compliance, stored balance verifications, and monthly report auditing.",
    responsibilities: [
      "Review employee directory and active daily rate schedules",
      "Inspect daily work entries and attendance histories",
      "Audit stored salary balances and unpaid wage claims",
      "Generate and export monthly payroll financial statements",
      "Inspect operational performance across work dates",
    ],
    accessLevel: "Supervisory Access (Review & Monthly Statements)",
  },
];

interface MatrixRow {
  module: string;
  icon: React.ElementType;
  description: string;
  ceo: string;
  admin: string;
  manager: string;
}

const PERMISSIONS_MATRIX: MatrixRow[] = [
  {
    module: "Employee Directory",
    icon: Users,
    description: "Create, view, and modify worker daily rate profiles",
    ceo: "Full Access (Create, Read, Edit)",
    admin: "Full Access (Create, Read, Edit)",
    manager: "View Only",
  },
  {
    module: "Daily Attendance & Work Records",
    icon: CalendarCheck,
    description: "Record daily worker attendance, rates, and stored statuses",
    ceo: "Full Access (Create, Status, Void)",
    admin: "Full Access (Create, Status, Void)",
    manager: "View Only",
  },
  {
    module: "Salary Disbursements",
    icon: CreditCard,
    description: "Process wage payments with FIFO partial allocation",
    ceo: "Full Access (Disburse, Void)",
    admin: "Full Access (Disburse)",
    manager: "View Disbursed History",
  },
  {
    module: "Payment Receipts",
    icon: FileText,
    description: "View, print, and download official payment receipts",
    ceo: "Full Access (View, Print, Download)",
    admin: "Full Access (View, Print, Download)",
    manager: "View & Download",
  },
  {
    module: "Monthly Payroll Reports",
    icon: FileText,
    description: "Monthly executive summaries, balance sheets, and export",
    ceo: "Full Access (Export CSV/Print)",
    admin: "No Access",
    manager: "Full Access (Export CSV/Print)",
  },
  {
    module: "Audit Trail Logs",
    icon: ClockCounterClockwise,
    description: "Immutable transaction audit log of all system actions",
    ceo: "Full Access (Audit Logs)",
    admin: "No Access",
    manager: "No Access",
  },
  {
    module: "Account Management",
    icon: UserGear,
    description: "Create, update, and delete system user login credentials",
    ceo: "Full Access (Create, Edit, Delete)",
    admin: "No Access",
    manager: "No Access",
  },
  {
    module: "System Settings",
    icon: GearSix,
    description: "Manage company details, preferences, and theme styling",
    ceo: "Full Access",
    admin: "View & Theme Settings",
    manager: "View Only",
  },
];

export default function RolesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await userService.getAll();
        setUsers(data);
      } catch {
        // Fallback gracefully
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers();
  }, []);

  const getRoleUserCount = (roleName: string) => {
    return users.filter((u) => u.role?.toUpperCase() === roleName.toUpperCase()).length;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150 w-full min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
            <ShieldStar size={16} weight="bold" />
            <span>Access Control Matrix</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            System Roles & Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Role definitions and authorization scopes across Sepakat Silaturrahim Enterprise
          </p>
        </div>

        {/* Total stats pill */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs w-fit">
          <Sparkle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total System Roles: </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">3 Designated Roles</span>
          </div>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {SYSTEM_ROLES.map((card) => {
          const userCount = getRoleUserCount(card.role);

          return (
            <div
              key={card.role}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                {/* Role Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono uppercase tracking-wider border ${card.badgeColor}`}>
                    {card.role}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-700/80">
                    {isLoading ? (
                      <CircleNotch size={12} className="animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Users size={12} weight="bold" className="text-slate-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {userCount} {userCount === 1 ? "user" : "users"}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                  {card.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {card.description}
                </p>

                {/* Key Responsibilities */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                    Authorized Operations
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {card.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle size={14} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Access Scope */}
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Scope:</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {card.accessLevel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Permissions Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden min-w-0">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Module Permissions Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Granular access distribution across operational modules
            </p>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
            8 Modules
          </span>
        </div>

        <div className="overflow-x-auto min-w-0">
          <table className="w-full min-w-[620px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4 sm:px-6">System Module</th>
                <th className="py-3 px-4 font-mono text-center">CEO Access</th>
                <th className="py-3 px-4 font-mono text-center">Admin Access</th>
                <th className="py-3 px-4 font-mono text-center">Manager Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {PERMISSIONS_MATRIX.map((row) => {
                const Icon = row.icon;
                return (
                  <tr key={row.module} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
                          <Icon size={16} weight="bold" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {row.module}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {row.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CEO */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle size={12} weight="fill" />
                        {row.ceo}
                      </span>
                    </td>

                    {/* ADMIN */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {row.admin === "No Access" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <XCircle size={12} weight="fill" />
                          No Access
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          <CheckCircle size={12} weight="fill" />
                          {row.admin}
                        </span>
                      )}
                    </td>

                    {/* MANAGER */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {row.manager === "No Access" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <XCircle size={12} weight="fill" />
                          No Access
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                          <CheckCircle size={12} weight="fill" />
                          {row.manager}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
