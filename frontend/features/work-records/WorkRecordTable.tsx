"use client";

import React from "react";
import {
  CalendarBlank,
  Archive,
  Prohibit,
  Users,
  CheckCircle,
  Clock,
  Money,
} from "@phosphor-icons/react";
import { WorkRecord, WorkRecordStatus } from "@/types/workRecord";
import { RateType, RATE_TYPE_LABELS, RATE_UNIT_LABELS } from "@/types/employee";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface WorkRecordTableProps {
  records: WorkRecord[];
  isLoading?: boolean;
  onStoreSalary: (record: WorkRecord) => void;
  onVoidRecord: (record: WorkRecord) => void;
  onBulkClick?: () => void;
  onSingleClick?: () => void;
  hasFilter?: boolean;
}

export function WorkRecordTable({
  records,
  isLoading = false,
  onStoreSalary,
  onVoidRecord,
  onBulkClick,
  onSingleClick,
  hasFilter = false,
}: WorkRecordTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee Name</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center mb-4">
          <CalendarBlank size={28} weight="duotone" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {hasFilter ? "No matching work records found" : "No work records recorded yet"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          {hasFilter
            ? "Try changing your date or status filters to view other records."
            : "Get started by recording daily work for today either in bulk or individually."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onBulkClick && (
            <Button
              variant="primary"
              size="sm"
              onClick={onBulkClick}
              className="whitespace-nowrap"
            >
              Record Work (Bulk)
            </Button>
          )}
          {onSingleClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSingleClick}
              className="whitespace-nowrap"
            >
              Single Record
            </Button>
          )}
        </div>
      </div>
    );
  }

  const renderStatusBadge = (status: WorkRecordStatus | string) => {
    switch (status) {
      case "UNPAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
            <Clock size={12} weight="bold" />
            UNPAID
          </span>
        );
      case "STORED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
            <Archive size={12} weight="bold" />
            STORED
          </span>
        );
      case "PARTIALLY_PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60">
            <Money size={12} weight="bold" />
            PARTIAL
          </span>
        );
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
            <CheckCircle size={12} weight="bold" />
            PAID
          </span>
        );
      case "VOID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 line-through">
            <Prohibit size={12} weight="bold" />
            VOID
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Mobile Card Layout (< md) */}
      <div className="block md:hidden space-y-3">
        {records.map((record) => {
          const isUnpaid = record.status === "UNPAID";
          const canVoid = record.status !== "PAID" && record.status !== "VOID";

          return (
            <div
              key={record.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {record.employeeName}
                    </span>
                    <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      {record.employeeCode}
                    </span>
                    {record.hoursWorked !== undefined && record.hoursWorked !== null && (
                      <span className="inline-flex items-center gap-1 font-mono text-2xs px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 font-semibold">
                        <Clock size={11} weight="bold" />
                        {record.hoursWorked} jam
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <CalendarBlank size={13} className="text-slate-400" />
                    <span>{formatDate(record.workDate)}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {renderStatusBadge(record.status)}
                </div>
              </div>

              {/* Financial detail strip */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-2xs">Rate</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(record.dailyRate)}
                    </span>
                    <span className="text-2xs text-slate-400">
                      / {record.rateType ? RATE_UNIT_LABELS[record.rateType] : (record.hoursWorked ? "jam" : "hari")}
                    </span>
                  </div>
                  {record.hoursWorked !== undefined && record.hoursWorked !== null && (
                    <span className="text-2xs text-amber-700 dark:text-amber-400 font-medium block mt-0.5">
                      {record.hoursWorked} jam bekerja
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-2xs">Calculated Amount</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(record.amount)}
                  </span>
                </div>
              </div>

              {record.notes && (
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/30 px-2.5 py-1.5 rounded-md border border-slate-100 dark:border-slate-800/60">
                  <span className="font-medium text-slate-500 dark:text-slate-400 mr-1">Notes:</span>
                  {record.notes}
                </div>
              )}

              {/* Action Buttons */}
              {(isUnpaid || canVoid) && (
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {isUnpaid && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStoreSalary(record)}
                      className="flex-1 sm:flex-initial text-indigo-700 dark:text-indigo-300 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/40 text-xs justify-center"
                      leftIcon={<Archive size={14} />}
                    >
                      Store Salary
                    </Button>
                  )}

                  {canVoid && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onVoidRecord(record)}
                      className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 text-xs"
                      title="Void this work record"
                    >
                      Void
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee Name</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {records.map((record) => {
                const isUnpaid = record.status === "UNPAID";
                const canVoid = record.status !== "PAID" && record.status !== "VOID";

                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatDate(record.workDate)}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {record.employeeCode}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{record.employeeName}</span>
                        {record.hoursWorked !== undefined && record.hoursWorked !== null && (
                          <span className="inline-flex items-center gap-1 font-mono text-2xs px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 font-semibold">
                            <Clock size={11} weight="bold" />
                            {record.hoursWorked} jam
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                            {formatCurrency(record.dailyRate)}
                          </span>
                          <span className="text-xs text-slate-400 font-normal">
                            / {record.rateType ? RATE_UNIT_LABELS[record.rateType] : (record.hoursWorked ? "jam" : "hari")}
                          </span>
                        </div>
                        {record.hoursWorked !== undefined && record.hoursWorked !== null && (
                          <span className="text-2xs text-amber-700 dark:text-amber-400 font-medium">
                            {record.hoursWorked} jam
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap tabular-nums">
                      {formatCurrency(record.amount)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderStatusBadge(record.status)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {record.notes ? record.notes : "-"}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isUnpaid && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onStoreSalary(record)}
                            className="whitespace-nowrap text-indigo-700 dark:text-indigo-300 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/40"
                            leftIcon={<Archive size={14} />}
                          >
                            Store Salary
                          </Button>
                        )}

                        {canVoid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onVoidRecord(record)}
                            className="whitespace-nowrap text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                            title="Void this work record"
                          >
                            Void
                          </Button>
                        )}

                        {!isUnpaid && !canVoid && (
                          <span className="text-xs text-slate-400 dark:text-slate-600 px-2">
                            -
                          </span>
                        )}
                      </div>
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
