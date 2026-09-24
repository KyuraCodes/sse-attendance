"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  CalendarCheck,
  WarningCircle,
  CalendarBlank,
  ArrowClockwise,
  Receipt,
  DownloadSimple,
} from "@phosphor-icons/react";
import { reportService } from "@/services/reportService";
import { MonthlyReport, OutstandingEmployeeReport, DailyReport } from "@/types/report";
import { MonthlyReportCard } from "@/features/reports/MonthlyReportCard";
import { OutstandingReportTable } from "@/features/reports/OutstandingReportTable";
import { DailyReportCard } from "@/features/reports/DailyReportCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  downloadMonthlyReportPdf,
  downloadOutstandingReportPdf,
  downloadDailyReportPdf,
} from "@/lib/pdfGenerator";

type ReportTab = "monthly" | "outstanding" | "daily";

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("monthly");

  // Filter States
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Data States
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [outstandingReports, setOutstandingReports] = useState<OutstandingEmployeeReport[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load Monthly Report
  const loadMonthlyData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportService.getMonthlyReport(selectedYear, selectedMonth);
      setMonthlyReport(data);
    } catch (err) {
      console.error("Error loading monthly report:", err);
      setError("Failed to load monthly report data. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  // Load Outstanding Balances Report
  const loadOutstandingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportService.getOutstandingReport();
      setOutstandingReports(data);
    } catch (err) {
      console.error("Error loading outstanding report:", err);
      setError("Failed to load outstanding balance data. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load Daily Report
  const loadDailyData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportService.getDailyReport(selectedDate);
      setDailyReport(data);
    } catch (err) {
      console.error("Error loading daily report:", err);
      setError("Failed to load daily report data. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  // Trigger data fetch on tab or parameter changes
  useEffect(() => {
    if (activeTab === "monthly") {
      loadMonthlyData();
    } else if (activeTab === "outstanding") {
      loadOutstandingData();
    } else if (activeTab === "daily") {
      loadDailyData();
    }
  }, [activeTab, loadMonthlyData, loadOutstandingData, loadDailyData]);

  const handleRefresh = () => {
    if (activeTab === "monthly") {
      loadMonthlyData();
    } else if (activeTab === "outstanding") {
      loadOutstandingData();
    } else if (activeTab === "daily") {
      loadDailyData();
    }
  };

  const handleDownloadCurrentReportPdf = () => {
    if (activeTab === "monthly" && monthlyReport) {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      downloadMonthlyReportPdf(monthlyReport, selectedYear, monthNames[selectedMonth - 1] || `Month ${selectedMonth}`);
    } else if (activeTab === "outstanding" && outstandingReports.length > 0) {
      downloadOutstandingReportPdf(outstandingReports);
    } else if (activeTab === "daily" && dailyReport) {
      downloadDailyReportPdf(dailyReport, selectedDate);
    }
  };

  const isCurrentReportDownloadable =
    (activeTab === "monthly" && Boolean(monthlyReport)) ||
    (activeTab === "outstanding" && outstandingReports.length > 0) ||
    (activeTab === "daily" && Boolean(dailyReport));

  return (
    <div className="space-y-6">
      {/* Page Header (Hidden in Print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Financial Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Executive monthly statements, worker liability tracking, and daily register
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCurrentReportPdf}
            disabled={isLoading || !isCurrentReportDownloadable}
            leftIcon={<DownloadSimple size={16} weight="bold" />}
            className="whitespace-nowrap"
          >
            Download PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
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
        </div>
      </div>

      {/* Tabs Switcher (Hidden in Print) */}
      <div className="print:hidden border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab("monthly")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer",
              activeTab === "monthly"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
            )}
          >
            <CalendarCheck size={18} weight={activeTab === "monthly" ? "bold" : "regular"} />
            <span>Monthly Statement</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("outstanding")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer",
              activeTab === "outstanding"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
            )}
          >
            <WarningCircle size={18} weight={activeTab === "outstanding" ? "bold" : "regular"} />
            <span>Outstanding Balances</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("daily")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer",
              activeTab === "daily"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
            )}
          >
            <CalendarBlank size={18} weight={activeTab === "daily" ? "bold" : "regular"} />
            <span>Daily Register</span>
          </button>
        </nav>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 flex items-center justify-between text-sm">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="text-xs font-semibold underline ml-4 hover:opacity-80"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Tab Panels */}
      <div>
        {activeTab === "monthly" && (
          <MonthlyReportCard
            report={monthlyReport}
            isLoading={isLoading}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            onRefresh={loadMonthlyData}
          />
        )}

        {activeTab === "outstanding" && (
          <OutstandingReportTable
            reports={outstandingReports}
            isLoading={isLoading}
          />
        )}

        {activeTab === "daily" && (
          <DailyReportCard
            report={dailyReport}
            isLoading={isLoading}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onRefresh={loadDailyData}
          />
        )}
      </div>
    </div>
  );
}
