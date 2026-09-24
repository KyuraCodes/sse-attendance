"use client";

import React, { useMemo } from "react";
import {
  CalendarBlank,
  Money,
  Printer,
  ArrowClockwise,
  Users,
  CheckCircle,
  WarningCircle,
  PiggyBank,
  Receipt,
  DownloadSimple,
} from "@phosphor-icons/react";
import { DailyReport } from "@/types/report";
import { WorkRecord } from "@/types/workRecord";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { STATUS_CONFIG, RecordStatus, COMPANY_NAME, SYSTEM_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { downloadDailyReportPdf } from "@/lib/pdfGenerator";

interface DailyReportCardProps {
  report: DailyReport | null;
  isLoading?: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onRefresh?: () => void;
}

const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYesterdayString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function DailyReportCard({
  report,
  isLoading = false,
  selectedDate,
  onDateChange,
  onRefresh,
}: DailyReportCardProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!report) return;
    downloadDailyReportPdf(report, selectedDate);
  };

  // Status breakdown calculations
  const breakdown = useMemo(() => {
    const counts = {
      PAID: 0,
      UNPAID: 0,
      STORED: 0,
      PARTIALLY_PAID: 0,
      VOID: 0,
    };
    const amounts = {
      PAID: 0,
      UNPAID: 0,
      STORED: 0,
      PARTIALLY_PAID: 0,
      VOID: 0,
    };

    if (report && report.records) {
      report.records.forEach((r) => {
        const s = (r.status || "UNPAID") as keyof typeof counts;
        if (counts[s] !== undefined) {
          counts[s] += 1;
          amounts[s] += Number(r.amount || 0);
        }
      });
    }

    return { counts, amounts };
  }, [report]);

  return (
    <div className="space-y-6">
      {/* Date Picker Bar (Hidden in Print) */}
      <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <CalendarBlank size={20} className="text-slate-500" />
              <input
                type="date"
                aria-label="Select Date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold py-2 px-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={() => onDateChange(getTodayString())}
              className={cn(
                "px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap",
                selectedDate === getTodayString()
                  ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => onDateChange(getYesterdayString())}
              className={cn(
                "px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap",
                selectedDate === getYesterdayString()
                  ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              Yesterday
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                leftIcon={
                  <ArrowClockwise
                    size={16}
                    className={cn(isLoading && "animate-spin")}
                  />
                }
                className="whitespace-nowrap"
              >
                Refresh
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isLoading || !report}
              leftIcon={<DownloadSimple size={16} weight="bold" />}
              className="whitespace-nowrap"
            >
              Download PDF
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer size={16} weight="bold" />}
              className="whitespace-nowrap"
            >
              Print / Export
            </Button>
          </div>
        </div>
      </div>

      {/* Official Header for Print Mode Only */}
      <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
        <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
          {COMPANY_NAME}
        </h1>
        <p className="text-xs text-slate-600">{SYSTEM_NAME}</p>
        <div className="mt-3 flex justify-between items-end">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Daily Attendance and Payroll Statement: {formatDate(selectedDate)}
            </h2>
            <p className="text-xs text-slate-500">
              Itemized attendance register and daily wage summary
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Generated: {formatDate(new Date())}</div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards for Selected Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Attendance Records */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Attendance Records
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
                {report?.totalRecords ?? 0}
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Workers present on {formatDate(selectedDate)}
            </p>
          </div>
        </div>

        {/* Total Daily Wage Incurred */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Daily Payroll
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Money size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {formatCurrency(report?.totalAmount ?? 0)}
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gross wages earned for this day
            </p>
          </div>
        </div>

        {/* Stored / Unpaid Status Mix */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Settlement Status
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <WarningCircle size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {breakdown.counts.PAID} Paid
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {breakdown.counts.STORED} Stored
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  {breakdown.counts.UNPAID} Unpaid
                </span>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Status distribution across shifts
            </p>
          </div>
        </div>
      </div>

      {/* Itemized Daily Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Daily Attendance Register
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Workers recorded on {formatDate(selectedDate)}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 py-1 px-2.5 rounded-full">
            {report?.records?.length ?? 0} records
          </span>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
              ))}
            </div>
          </div>
        ) : !report || report.records.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Receipt size={24} weight="duotone" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No records for this date
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No work attendance or wages were logged for {formatDate(selectedDate)}.
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
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Daily Rate
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {report.records.map((record: WorkRecord) => {
                  const statusKey = (record.status || "UNPAID") as RecordStatus;
                  const meta = STATUS_CONFIG[statusKey] || STATUS_CONFIG.UNPAID;

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {record.employeeCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {record.employeeName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {formatCurrency(record.dailyRate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 font-mono">
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            meta.badgeClass
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", meta.dotColor)} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {record.notes || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-semibold">
                  <td colSpan={3} className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300">
                    Daily Total:
                  </td>
                  <td className="py-3.5 px-4 font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(report.totalAmount)}
                  </td>
                  <td colSpan={2} className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    {report.totalRecords} workers recorded
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
