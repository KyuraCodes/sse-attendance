"use client";

import React, { useMemo } from "react";
import {
  CalendarCheck,
  Money,
  CheckCircle,
  WarningCircle,
  Printer,
  ArrowClockwise,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Receipt,
  DownloadSimple,
  FileXls,
  FileCsv,
} from "@phosphor-icons/react";
import { MonthlyReport } from "@/types/report";
import { WorkRecord } from "@/types/workRecord";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { STATUS_CONFIG, RecordStatus, COMPANY_NAME, SYSTEM_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { downloadMonthlyReportPdf } from "@/lib/pdfGenerator";

interface MonthlyReportCardProps {
  report: MonthlyReport | null;
  isLoading?: boolean;
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onRefresh?: () => void;
  onExportExcel?: () => void;
  onExportCsv?: () => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027];

export function MonthlyReportCard({
  report,
  isLoading = false,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  onRefresh,
  onExportExcel,
  onExportCsv,
}: MonthlyReportCardProps) {
  const monthName = MONTH_NAMES[selectedMonth - 1] || `Month ${selectedMonth}`;

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      onMonthChange(12);
      onYearChange(selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onMonthChange(1);
      onYearChange(selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!report) return;
    downloadMonthlyReportPdf(report, selectedYear, monthName);
  };

  // Calculate percentage paid for visual indicator
  const paidPercentage = useMemo(() => {
    if (!report || report.grossPayroll <= 0) return 0;
    const pct = Math.round((report.paidAmount / report.grossPayroll) * 100);
    return Math.min(100, Math.max(0, pct));
  }, [report]);

  return (
    <div className="space-y-6">
      {/* Month & Year Selection Bar (Hidden in Print) */}
      <div className="print:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePreviousMonth}
              aria-label="Previous Month"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <CaretLeft size={16} weight="bold" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial justify-center">
              <CalendarBlank size={18} className="text-slate-500 shrink-0" />
              <select
                aria-label="Select Month"
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold py-2 px-2.5 sm:px-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Select Year"
                value={selectedYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold py-2 px-2.5 sm:px-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {AVAILABLE_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
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
                className="flex-1 sm:flex-initial justify-center whitespace-nowrap"
              >
                Refresh
              </Button>
            )}

            {onExportExcel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportExcel}
                disabled={isLoading || !report}
                leftIcon={<FileXls size={16} weight="bold" className="text-emerald-600 dark:text-emerald-400" />}
                className="flex-1 sm:flex-initial justify-center whitespace-nowrap"
              >
                Excel
              </Button>
            )}

            {onExportCsv && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCsv}
                disabled={isLoading || !report}
                leftIcon={<FileCsv size={16} weight="bold" className="text-blue-600 dark:text-blue-400" />}
                className="flex-1 sm:flex-initial justify-center whitespace-nowrap"
              >
                CSV
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isLoading || !report}
              leftIcon={<DownloadSimple size={16} weight="bold" />}
              className="flex-1 sm:flex-initial justify-center whitespace-nowrap"
            >
              Download PDF
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer size={16} weight="bold" />}
              className="flex-1 sm:flex-initial justify-center whitespace-nowrap"
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
              Monthly Financial Statement: {monthName} {selectedYear}
            </h2>
            <p className="text-xs text-slate-500">
              Summary of daily attendance, gross earnings, and payment disbursements
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Generated: {formatDate(new Date())}</div>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards matching PRD Section 9.13 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Work Records */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-2xs sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Work Records
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CalendarCheck size={18} weight="duotone" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            {isLoading ? (
              <div className="h-7 sm:h-8 w-20 sm:w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {report?.totalWorkRecords ?? 0}
              </div>
            )}
            <p className="text-2xs sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verified daily attendance shifts
            </p>
          </div>
        </div>

        {/* Gross Payroll */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-2xs sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Gross Payroll
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Money size={18} weight="duotone" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            {isLoading ? (
              <div className="h-7 sm:h-8 w-24 sm:w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                {formatCurrency(report?.grossPayroll ?? 0)}
              </div>
            )}
            <p className="text-2xs sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total earned wages for {monthName}
            </p>
          </div>
        </div>

        {/* Paid Amount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-2xs sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Paid
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle size={18} weight="duotone" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            {isLoading ? (
              <div className="h-7 sm:h-8 w-24 sm:w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <div className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 truncate">
                {formatCurrency(report?.paidAmount ?? 0)}
              </div>
            )}
            <p className="text-2xs sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
              Disbursed via payment vouchers
            </p>
          </div>
        </div>

        {/* Outstanding Amount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-2xs sm:text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Outstanding
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <WarningCircle size={18} weight="duotone" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            {isLoading ? (
              <div className="h-7 sm:h-8 w-24 sm:w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <div className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-400 truncate">
                {formatCurrency(report?.outstandingAmount ?? 0)}
              </div>
            )}
            <p className="text-2xs sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
              Unpaid or stored balances
            </p>
          </div>
        </div>
      </div>

      {/* Disbursement Progress Bar */}
      {!isLoading && report && report.grossPayroll > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Disbursement Settlement Rate: {paidPercentage}%
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {formatCurrency(report.paidAmount)} of {formatCurrency(report.grossPayroll)}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${paidPercentage}%` }}
              title={`Paid: ${paidPercentage}%`}
            />
            <div
              className="bg-amber-400 transition-all duration-500"
              style={{ width: `${100 - paidPercentage}%` }}
              title={`Outstanding: ${100 - paidPercentage}%`}
            />
          </div>
        </div>
      )}

      {/* Itemized Records Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Itemized Records Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Detailed listing of attendance and wage records for {monthName} {selectedYear}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 py-1 px-2.5 rounded-full">
            {report?.records?.length ?? 0} entries
          </span>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((idx) => (
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
              No work records found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              There are no attendance or wage records logged for {monthName} {selectedYear}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Employee
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
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(record.workDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {record.employeeName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {record.employeeCode}
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
                    Monthly Gross Total:
                  </td>
                  <td className="py-3.5 px-4 font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(report.grossPayroll)}
                  </td>
                  <td colSpan={2} className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    Paid: {formatCurrency(report.paidAmount)} | Outstanding: {formatCurrency(report.outstandingAmount)}
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
