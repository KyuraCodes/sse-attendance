"use client";

import React from "react";
import Link from "next/link";
import { Warning, ArrowRight, Wallet } from "@phosphor-icons/react";
import { StoredSalaryAlert as StoredSalaryAlertType } from "@/types/dashboard";
import { formatCurrency, formatDate } from "@/lib/utils";

interface StoredSalaryAlertProps {
  alerts: StoredSalaryAlertType[];
}

export function StoredSalaryAlert({ alerts }: StoredSalaryAlertProps) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  // Calculate days elapsed since oldest stored record
  const getDaysElapsed = (dateString: string): number => {
    if (!dateString) return 0;
    try {
      const stored = new Date(dateString);
      const today = new Date();
      // Reset hours to midnight for accurate whole-day difference
      stored.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffMs = today.getTime() - stored.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  };

  const totalHeld = alerts.reduce(
    (sum, a) => sum + (Number(a.totalStoredAmount ?? a.totalAmount) || 0),
    0
  );

  return (
    <div
      role="alert"
      className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl p-4 sm:p-5 transition-colors"
    >
      {/* Alert Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-amber-200/60 dark:border-amber-800/50">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">
            <Warning size={20} weight="fill" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              Stored Salary Holding Notice
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-200/80 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200">
                {alerts.length} {alerts.length === 1 ? "Employee" : "Employees"}
              </span>
            </h2>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Accumulated wages requested as held savings. Total held:{" "}
              <strong className="font-mono tabular-nums text-amber-950 dark:text-amber-100">
                {formatCurrency(totalHeld)}
              </strong>
            </p>
          </div>
        </div>

        <Link
          href="/work-records"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:text-amber-950 dark:hover:text-amber-100 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200/80 dark:hover:bg-amber-800/60 px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          <span>View Work Records</span>
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>

      {/* Alert Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {alerts.map((alert) => {
          const days = getDaysElapsed(alert.oldestStoredDate);
          const amount = Number(alert.totalStoredAmount ?? alert.totalAmount) || 0;

          return (
            <div
              key={alert.employeeId}
              className="bg-white/80 dark:bg-slate-900/80 rounded-lg border border-amber-200/80 dark:border-amber-800/60 p-3 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {alert.employeeName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    ({alert.employeeCode})
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                  <span className="flex items-center gap-1">
                    <Wallet size={13} weight="bold" />
                    <span>{alert.storedCount} records</span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span>{days} {days === 1 ? "day" : "days"} stored</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                  {formatCurrency(amount)}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  Since {formatDate(alert.oldestStoredDate)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StoredSalaryAlert;
