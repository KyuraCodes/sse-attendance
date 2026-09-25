"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarCheck,
  Plus,
  UsersThree,
  MagnifyingGlass,
  ArrowClockwise,
  WarningCircle,
  CheckCircle,
  X,
  Funnel,
  CalendarBlank,
  Clock,
  Archive,
  Money,
  CheckSquare,
} from "@phosphor-icons/react";
import { workRecordService } from "@/services/workRecordService";
import { WorkRecord, WorkRecordFilterStatus } from "@/types/workRecord";
import { WorkRecordTable } from "@/features/work-records/WorkRecordTable";
import { BulkRecordModal } from "@/features/work-records/BulkRecordModal";
import { DailyRecordModal } from "@/features/work-records/DailyRecordModal";
import { StoreSalaryModal } from "@/features/work-records/StoreSalaryModal";
import { VoidRecordModal } from "@/features/work-records/VoidRecordModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function WorkRecordsPage() {
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [statusFilter, setStatusFilter] = useState<WorkRecordFilterStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [storingRecord, setStoringRecord] = useState<WorkRecord | null>(null);
  const [voidingRecord, setVoidingRecord] = useState<WorkRecord | null>(null);

  // Toast feedback
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load records
  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await workRecordService.getWorkRecords({
        date: selectedDate ? selectedDate : undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setRecords(data);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load work records. Please check your connection.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, statusFilter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Auto-dismiss toast feedback
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Filter records locally by worker name or employee code
  const filteredRecords = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return records;
    }
    const lower = debouncedSearch.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.employeeName.toLowerCase().includes(lower) ||
        r.employeeCode.toLowerCase().includes(lower) ||
        (r.notes && r.notes.toLowerCase().includes(lower))
    );
  }, [records, debouncedSearch]);

  // Metrics summary for the current view
  const metrics = useMemo(() => {
    let totalCount = 0;
    let totalAmount = 0;
    let unpaidCount = 0;
    let unpaidAmount = 0;
    let storedCount = 0;
    let storedAmount = 0;
    let paidCount = 0;

    filteredRecords.forEach((r) => {
      totalCount += 1;
      const amt = Number(r.amount) || 0;
      totalAmount += amt;

      if (r.status === "UNPAID") {
        unpaidCount += 1;
        unpaidAmount += amt;
      } else if (r.status === "STORED") {
        storedCount += 1;
        storedAmount += amt;
      } else if (r.status === "PAID") {
        paidCount += 1;
      }
    });

    return {
      totalCount,
      totalAmount,
      unpaidCount,
      unpaidAmount,
      storedCount,
      storedAmount,
      paidCount,
    };
  }, [filteredRecords]);

  // Handlers
  const handleBulkSuccess = (count: number, amount: number) => {
    setFeedbackMessage({
      type: "success",
      text: `Successfully recorded work for ${count} workers (${formatCurrency(amount)}).`,
    });
    loadRecords();
  };

  const handleDailySuccess = (record: WorkRecord) => {
    setFeedbackMessage({
      type: "success",
      text: `Work record recorded for ${record.employeeName} (${formatCurrency(record.amount)}).`,
    });
    loadRecords();
  };

  const handleStoreSuccess = (record: WorkRecord) => {
    setFeedbackMessage({
      type: "success",
      text: `Salary for ${record.employeeName} (${formatDate(record.workDate)}) marked as STORED.`,
    });
    loadRecords();
  };

  const handleVoidSuccess = (record: WorkRecord) => {
    setFeedbackMessage({
      type: "success",
      text: `Work record for ${record.employeeName} on ${formatDate(record.workDate)} has been VOIDED.`,
    });
    loadRecords();
  };

  const statusOptions: { label: string; value: WorkRecordFilterStatus }[] = [
    { label: "All Statuses", value: "ALL" },
    { label: "UNPAID", value: "UNPAID" },
    { label: "STORED", value: "STORED" },
    { label: "PARTIAL", value: "PARTIALLY_PAID" },
    { label: "PAID", value: "PAID" },
    { label: "VOID", value: "VOID" },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div
          role="status"
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm animate-in slide-in-from-bottom-5 duration-200",
            feedbackMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          )}
        >
          {feedbackMessage.type === "success" ? (
            <CheckCircle size={20} weight="fill" className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <WarningCircle size={20} weight="fill" className="shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span className="font-medium">{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Action Bar & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarCheck size={22} weight="duotone" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Work Records
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Record worker attendance, calculate daily wages, and manage stored salaries
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsDailyModalOpen(true)}
            leftIcon={<Plus size={16} weight="bold" />}
            className="justify-center whitespace-nowrap"
          >
            Single Record
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsBulkModalOpen(true)}
            leftIcon={<UsersThree size={18} weight="bold" />}
            className="justify-center whitespace-nowrap shadow-sm"
          >
            Record Work (Bulk)
          </Button>
        </div>
      </div>

      {/* KPI / Operational Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Records</span>
            <CalendarBlank size={18} weight="duotone" className="text-slate-400" />
          </div>
          <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
            {metrics.totalCount}
          </div>
          <div className="text-2xs text-slate-400 mt-1 font-mono truncate">
            {formatCurrency(metrics.totalAmount)} gross
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Unpaid Records</span>
            <Clock size={18} weight="duotone" className="text-amber-500" />
          </div>
          <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {metrics.unpaidCount}
          </div>
          <div className="text-2xs text-amber-700/80 dark:text-amber-400/80 mt-1 font-mono truncate">
            {formatCurrency(metrics.unpaidAmount)} payable
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Stored Salary</span>
            <Archive size={18} weight="duotone" className="text-indigo-500" />
          </div>
          <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
            {metrics.storedCount}
          </div>
          <div className="text-2xs text-indigo-700/80 dark:text-indigo-400/80 mt-1 font-mono truncate">
            {formatCurrency(metrics.storedAmount)} stored
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Fully Paid</span>
            <CheckCircle size={18} weight="duotone" className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {metrics.paidCount}
          </div>
          <div className="text-2xs text-slate-400 mt-1 font-mono">
            Settled records
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date Selector with Quick Actions */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={cn(
                  "w-full sm:w-auto h-9 pl-9 pr-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer",
                  "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                  "border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                )}
              />
              <CalendarBlank
                size={16}
                weight="duotone"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(getTodayDateString())}
              className={cn(
                "h-9 px-2.5 sm:px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
                selectedDate === getTodayDateString()
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              )}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(getYesterdayDateString())}
              className={cn(
                "h-9 px-2.5 sm:px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
                selectedDate === getYesterdayDateString()
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              )}
            >
              Yesterday
            </button>

            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate("")}
                className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                title="View all recorded dates"
              >
                All Dates
              </button>
            )}
          </div>

          {/* Search worker */}
          <div className="flex items-center gap-2 w-full md:w-auto md:max-w-xs">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search worker or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadRecords}
              isLoading={isLoading}
              className="h-9 whitespace-nowrap shrink-0"
              title="Refresh records"
            >
              <ArrowClockwise size={16} />
            </Button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1.5 flex items-center gap-1 shrink-0">
            <Funnel size={14} />
            Status:
          </span>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer select-none",
                statusFilter === opt.value
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-300 text-sm"
        >
          <div className="flex items-center gap-3">
            <WarningCircle size={20} weight="fill" className="shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRecords}
            className="whitespace-nowrap"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Work Records Table */}
      <WorkRecordTable
        records={filteredRecords}
        isLoading={isLoading}
        onStoreSalary={(record) => setStoringRecord(record)}
        onVoidRecord={(record) => setVoidingRecord(record)}
        onBulkClick={() => setIsBulkModalOpen(true)}
        onSingleClick={() => setIsDailyModalOpen(true)}
        hasFilter={Boolean(selectedDate || statusFilter !== "ALL" || debouncedSearch)}
      />

      {/* Modals */}
      <BulkRecordModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={handleBulkSuccess}
        initialDate={selectedDate || getTodayDateString()}
      />

      <DailyRecordModal
        isOpen={isDailyModalOpen}
        onClose={() => setIsDailyModalOpen(false)}
        onSuccess={handleDailySuccess}
        initialDate={selectedDate || getTodayDateString()}
      />

      <StoreSalaryModal
        isOpen={Boolean(storingRecord)}
        record={storingRecord}
        onClose={() => setStoringRecord(null)}
        onSuccess={handleStoreSuccess}
      />

      <VoidRecordModal
        isOpen={Boolean(voidingRecord)}
        record={voidingRecord}
        onClose={() => setVoidingRecord(null)}
        onSuccess={handleVoidSuccess}
      />
    </div>
  );
}
