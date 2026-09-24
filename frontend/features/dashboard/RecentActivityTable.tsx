"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Money,
  ArrowRight,
  CreditCard,
  Bank,
  DeviceMobile,
  Question,
} from "@phosphor-icons/react";
import { DashboardWorkRecord, DashboardPayment } from "@/types/dashboard";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { STATUS_CONFIG, RecordStatus } from "@/lib/constants";

interface RecentActivityTableProps {
  workRecords: DashboardWorkRecord[];
  payments: DashboardPayment[];
  isLoading?: boolean;
}

export function RecentActivityTable({
  workRecords,
  payments,
  isLoading = false,
}: RecentActivityTableProps) {
  const [activeTab, setActiveTab] = useState<"all" | "work" | "payments">("all");

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toUpperCase()) {
      case "CASH":
        return <Money size={14} weight="bold" className="text-emerald-600 dark:text-emerald-400" />;
      case "BANK_TRANSFER":
        return <Bank size={14} weight="bold" className="text-sky-600 dark:text-sky-400" />;
      case "DUITNOW":
        return <DeviceMobile size={14} weight="bold" className="text-pink-600 dark:text-pink-400" />;
      default:
        return <CreditCard size={14} weight="bold" className="text-slate-500" />;
    }
  };

  const formatPaymentMethod = (method: string) => {
    switch (method?.toUpperCase()) {
      case "CASH":
        return "Cash";
      case "BANK_TRANSFER":
        return "Bank Transfer";
      case "DUITNOW":
        return "DuitNow";
      default:
        return method || "Other";
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs animate-pulse"
          >
            <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile/Responsive View Toggle */}
      <div className="flex sm:hidden items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
            activeTab === "all"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          )}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("work")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
            activeTab === "work"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          )}
        >
          Work Records
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
            activeTab === "payments"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          )}
        >
          Payments
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Work Records Table Card */}
        {(activeTab === "all" || activeTab === "work") && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CalendarCheck size={18} weight="duotone" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Recent Work Records
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Latest daily attendance logs
                  </p>
                </div>
              </div>

              <Link
                href="/work-records"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <span>View all</span>
                <ArrowRight size={13} weight="bold" />
              </Link>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-x-auto">
              {workRecords.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                  No work records logged for this period
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <th scope="col" className="px-4 py-2.5">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-2.5">
                        Employee
                      </th>
                      <th scope="col" className="px-4 py-2.5 text-right">
                        Amount
                      </th>
                      <th scope="col" className="px-4 py-2.5 text-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {workRecords.map((record) => {
                      const statusMeta =
                        STATUS_CONFIG[record.status as RecordStatus] || STATUS_CONFIG.UNPAID;

                      return (
                        <tr
                          key={record.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {formatDate(record.workDate)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[180px]">
                              {record.employeeName}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                              {record.employeeCode}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {formatCurrency(record.amount)}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                                statusMeta.badgeClass
                              )}
                            >
                              <span
                                className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusMeta.dotColor)}
                                aria-hidden="true"
                              />
                              {statusMeta.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Recent Payments Table Card */}
        {(activeTab === "all" || activeTab === "payments") && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Money size={18} weight="duotone" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Recent Payments
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Latest salary disbursement transactions
                  </p>
                </div>
              </div>

              <Link
                href="/payments"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <span>View all</span>
                <ArrowRight size={13} weight="bold" />
              </Link>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-x-auto">
              {payments.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                  No disbursement payments recorded yet
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <th scope="col" className="px-4 py-2.5">
                        Code
                      </th>
                      <th scope="col" className="px-4 py-2.5">
                        Employee
                      </th>
                      <th scope="col" className="px-4 py-2.5">
                        Method
                      </th>
                      <th scope="col" className="px-4 py-2.5 text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {payments.map((pmt) => (
                      <tr
                        key={pmt.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {pmt.paymentCode}
                          </span>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            {formatDate(pmt.paymentDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[180px]">
                            {pmt.employeeName}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                            {pmt.employeeCode}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                            {getPaymentMethodIcon(pmt.paymentMethod)}
                            <span>{formatPaymentMethod(pmt.paymentMethod)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatCurrency(pmt.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentActivityTable;
