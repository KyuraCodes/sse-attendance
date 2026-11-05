"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { EditWorkRecordModal } from "@/features/work-records/EditWorkRecordModal";
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
  const [editingRecord, setEditingRecord] = useState<WorkRecord | null>(null);

  // Toast feedback
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      if (isMountedRef.current) {
        setRecords(data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const msg =
          err instanceof Error
            ? err.message
            : "Gagal memuatkan rekod kerja. Sila semak sambungan internet anda.";
        setError(msg);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [selectedDate, statusFilter]);

  const fetchRecords = loadRecords;

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
      text: `Berjaya merekodkan kehadiran untuk ${count} pekerja (${formatCurrency(amount)}).`,
    });
    loadRecords();
  };

  const handleDailySuccess = (record: WorkRecord) => {
    setFeedbackMessage({
      type: "success",
      text: `Rekod kerja untuk ${record.employeeName} (${formatCurrency(record.amount)}) berjaya disimpan.`,
    });
    loadRecords();
  };

  const handleStoreSuccess = (record: WorkRecord) => {
    setFeedbackMessage({
      type: "success",
      text: `Gaji untuk ${record.employeeName} (${formatDate(record.workDate)}) ditandakan sebagai SIMPAN GAJI.`,
    });
    loadRecords();
  };

  const handleVoidSuccess = (record: WorkRecord) => {
    setFeedbackMessage({
      type: "success",
      text: `Rekod kerja untuk ${record.employeeName} pada ${formatDate(record.workDate)} telah dibatalkan (VOID).`,
    });
    loadRecords();
  };

  const statusOptions: { label: string; value: WorkRecordFilterStatus }[] = [
    { label: "Semua", value: "ALL" },
    { label: "Belum Bayar", value: "UNPAID" },
    { label: "Simpan Gaji", value: "STORED" },
    { label: "Separa Bayar", value: "PARTIALLY_PAID" },
    { label: "Selesai Bayar", value: "PAID" },
    { label: "Dibatalkan", value: "VOID" },
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const tabs: WorkRecordFilterStatus[] = [
      "ALL",
      "UNPAID",
      "STORED",
      "PARTIALLY_PAID",
      "PAID",
      "VOID",
    ];
    const currentIndex = tabs.indexOf(statusFilter);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabs.length;
      setStatusFilter(tabs[nextIndex]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setStatusFilter(tabs[prevIndex]);
    } else if (e.key === "Home") {
      e.preventDefault();
      setStatusFilter(tabs[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      setStatusFilter(tabs[tabs.length - 1]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div
          role="status"
          className={cn(
            "fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm animate-in slide-in-from-bottom-5 duration-200 motion-reduce:animate-none",
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
            aria-label="Tutup pemberitahuan"
            className="p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-1 flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-md transition-colors cursor-pointer"
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
                Rekod Kerja
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Catat kehadiran harian, kiraan upah kerja, dan urus simpanan gaji pekerja
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
            Rekod Harian
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsBulkModalOpen(true)}
            leftIcon={<UsersThree size={18} weight="bold" />}
            className="justify-center whitespace-nowrap shadow-sm"
          >
            Rekod Kerja (Pukal)
          </Button>
        </div>
      </div>

      {/* KPI / Operational Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Jumlah Rekod</span>
            <CalendarBlank size={18} weight="duotone" className="text-slate-400" />
          </div>
          <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
            {metrics.totalCount}
          </div>
          <div className="text-2xs text-slate-400 mt-1 font-mono truncate">
            {formatCurrency(metrics.totalAmount)} kasar
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Belum Bayar</span>
            <Clock size={18} weight="duotone" className="text-amber-500" />
          </div>
          <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {metrics.unpaidCount}
          </div>
          <div className="text-2xs text-amber-700/80 dark:text-amber-400/80 mt-1 font-mono truncate">
            {formatCurrency(metrics.unpaidAmount)} perlu bayar
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Simpan Gaji</span>
            <Archive size={18} weight="duotone" className="text-blue-500 dark:text-blue-400" />
          </div>
          <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
            {metrics.storedCount}
          </div>
          <div className="text-2xs text-blue-700/80 dark:text-blue-400/80 mt-1 font-mono truncate">
            {formatCurrency(metrics.storedAmount)} disimpan
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Selesai Bayar</span>
            <CheckCircle size={18} weight="duotone" className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {metrics.paidCount}
          </div>
          <div className="text-2xs text-slate-400 mt-1 font-mono">
            Telah diselesaikan
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
                  "w-full sm:w-auto min-h-[44px] sm:min-h-0 sm:h-9 pl-9 pr-2.5 rounded-lg border text-base sm:text-xs font-medium transition-colors cursor-pointer",
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
                "min-h-[44px] sm:min-h-0 sm:h-9 px-3.5 sm:px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
                selectedDate === getTodayDateString()
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              )}
            >
              Hari Ini
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(getYesterdayDateString())}
              className={cn(
                "min-h-[44px] sm:min-h-0 sm:h-9 px-3.5 sm:px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
                selectedDate === getYesterdayDateString()
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              )}
            >
              Semalam
            </button>

            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate("")}
                className="min-h-[44px] sm:min-h-0 sm:h-9 px-3 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                title="Papar semua tarikh rekod"
              >
                Semua Tarikh
              </button>
            )}
          </div>

          {/* Search worker */}
          <div className="flex items-center gap-2 w-full md:w-auto md:max-w-xs">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Cari nama atau kod pekerja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 min-h-[44px] sm:min-h-0 sm:h-9 text-base sm:text-xs"
              />
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Kosongkan carian"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
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
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-9 whitespace-nowrap shrink-0"
              title="Muat semula rekod"
            >
              <ArrowClockwise size={16} />
            </Button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div
          role="tablist"
          aria-label="Penapis status rekod kerja"
          onKeyDown={handleTabKeyDown}
          className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1 overscroll-x-contain"
        >
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1.5 flex items-center gap-1 shrink-0">
            <Funnel size={14} />
            Status:
          </span>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              id={`tab-${opt.value.toLowerCase()}`}
              aria-selected={statusFilter === opt.value}
              tabIndex={statusFilter === opt.value ? 0 : -1}
              aria-controls="work-records-table"
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "min-h-[38px] sm:min-h-0 px-3.5 py-1.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
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
            Cuba Lagi
          </Button>
        </div>
      )}

      {/* Work Records Table */}
      <WorkRecordTable
        records={filteredRecords}
        isLoading={isLoading}
        onStoreSalary={(record) => setStoringRecord(record)}
        onVoidRecord={(record) => setVoidingRecord(record)}
        onEditRecord={(record) => setEditingRecord(record)}
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

      <EditWorkRecordModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        onUpdated={() => {
          setEditingRecord(null);
          fetchRecords();
        }}
      />
    </div>
  );
}
