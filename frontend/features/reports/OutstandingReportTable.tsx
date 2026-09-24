"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Money,
  WarningCircle,
  CreditCard,
  MagnifyingGlass,
  CheckCircle,
  PiggyBank,
  CalendarBlank,
} from "@phosphor-icons/react";
import { OutstandingEmployeeReport } from "@/types/report";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface OutstandingReportTableProps {
  reports: OutstandingEmployeeReport[];
  isLoading?: boolean;
}

export function OutstandingReportTable({
  reports,
  isLoading = false,
}: OutstandingReportTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const query = searchQuery.toLowerCase().trim();
    return reports.filter(
      (r) =>
        r.employeeName.toLowerCase().includes(query) ||
        r.employeeCode.toLowerCase().includes(query) ||
        (r.phone && r.phone.toLowerCase().includes(query))
    );
  }, [reports, searchQuery]);

  // Aggregate totals
  const totals = useMemo(() => {
    return reports.reduce(
      (acc, curr) => {
        acc.totalOutstanding += curr.totalOutstanding || curr.outstandingBalance || 0;
        acc.totalStoredAmount += curr.storedAmount || 0;
        acc.totalUnpaidDays += curr.unpaidDays || curr.totalWorkDaysUnpaid || 0;
        acc.totalStoredDays += curr.storedDays || curr.storedCount || 0;
        return acc;
      },
      {
        totalOutstanding: 0,
        totalStoredAmount: 0,
        totalUnpaidDays: 0,
        totalStoredDays: 0,
      }
    );
  }, [reports]);

  return (
    <div className="space-y-6">
      {/* 4 Summary Aggregate Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workers Pending Payment */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Workers With Balance
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {reports.length}
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active accounts requiring settlement
            </p>
          </div>
        </div>

        {/* Total Unpaid Days */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Unpaid Days
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CalendarBlank size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {totals.totalUnpaidDays} days
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Accumulated unbilled attendance shifts
            </p>
          </div>
        </div>

        {/* Stored Wages */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              Stored Wages (Tabung)
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PiggyBank size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                {formatCurrency(totals.totalStoredAmount)}
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {totals.totalStoredDays} days saved at worker request
            </p>
          </div>
        </div>

        {/* Total Outstanding Balance */}
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Total Outstanding Balance
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center">
              <WarningCircle size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 font-mono">
                {formatCurrency(totals.totalOutstanding)}
              </div>
            )}
            <p className="text-xs text-rose-600 dark:text-rose-400/80 mt-1">
              Total pending company payroll liability
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Table Search Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Outstanding Balances by Employee
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live breakdown of unpaid days, stored wages, and total amounts due
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <MagnifyingGlass size={16} />
            </div>
            <input
              type="text"
              placeholder="Search by worker name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
              ))}
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle size={28} weight="duotone" />
            </div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {searchQuery ? "No matching records found" : "All accounts fully settled"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "Try searching with a different employee name or employee code."
                : "There are currently no outstanding unpaid days or stored wage balances for any workers."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Worker Code
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Worker Name
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                    Unpaid Days
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                    Stored Days
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Stored Amount
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Outstanding
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredReports.map((row) => {
                  const unpaid = row.unpaidDays || row.totalWorkDaysUnpaid || 0;
                  const storedDays = row.storedDays || row.storedCount || 0;
                  const storedAmt = row.storedAmount || 0;
                  const total = row.totalOutstanding || row.outstandingBalance || 0;

                  return (
                    <tr
                      key={row.employeeId}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-600 dark:text-slate-400">
                        {row.employeeCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {row.employeeName}
                        </div>
                        {row.phone && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {row.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                            unpaid > 0
                              ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                              : "text-slate-400"
                          )}
                        >
                          {unpaid} {unpaid === 1 ? "day" : "days"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                            storedDays > 0
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              : "text-slate-400"
                          )}
                        >
                          {storedDays} {storedDays === 1 ? "day" : "days"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrency(storedAmt)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(total)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/payments?employeeId=${row.employeeId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs transition-colors whitespace-nowrap"
                        >
                          <CreditCard size={14} weight="bold" />
                          <span>Pay</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-semibold">
                  <td colSpan={2} className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">
                    Grand Total:
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-slate-100">
                    {totals.totalUnpaidDays} days
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-slate-100">
                    {totals.totalStoredDays} days
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(totals.totalStoredAmount)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-base font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(totals.totalOutstanding)}
                  </td>
                  <td className="py-3.5 px-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
