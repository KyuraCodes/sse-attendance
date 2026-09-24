"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CreditCard,
  Plus,
  MagnifyingGlass,
  ArrowClockwise,
  WarningCircle,
  CheckCircle,
  X,
  Funnel,
  CalendarBlank,
  Coins,
  Receipt,
  User,
  ClockCounterClockwise,
} from "@phosphor-icons/react";
import { paymentService } from "@/services/paymentService";
import { employeeService } from "@/services/employeeService";
import { Payment, ReceiptDto, OutstandingReportDto } from "@/types/payment";
import { Employee } from "@/types/employee";
import { PaymentTable } from "@/features/payments/PaymentTable";
import { CreatePaymentModal } from "@/features/payments/CreatePaymentModal";
import { PaymentReceiptModal } from "@/features/payments/PaymentReceiptModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const getFirstDayOfMonth = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [outstandingReports, setOutstandingReports] = useState<OutstandingReportDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [activeReceiptPaymentId, setActiveReceiptPaymentId] = useState<number | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptDto | null>(null);

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

  // Load employee list for dropdown filter
  useEffect(() => {
    employeeService
      .getEmployees()
      .then((data) => setEmployees(data))
      .catch(() => {});
  }, []);

  // Load payments and outstanding balance metrics
  const loadPaymentsAndMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [paymentsData, outstandingData] = await Promise.all([
        paymentService.getPayments({
          employeeId: selectedEmployeeId ? Number(selectedEmployeeId) : undefined,
          startDate: startDate ? startDate : undefined,
          endDate: endDate ? endDate : undefined,
        }),
        paymentService.getOutstandingReport(),
      ]);

      setPayments(paymentsData);
      setOutstandingReports(outstandingData);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load payment records. Please check your connection.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEmployeeId, startDate, endDate]);

  useEffect(() => {
    loadPaymentsAndMetrics();
  }, [loadPaymentsAndMetrics]);

  // Auto-dismiss toast feedback
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Filter payments locally by debounced search
  const filteredPayments = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return payments;
    }
    const lower = debouncedSearch.toLowerCase().trim();
    return payments.filter(
      (p) =>
        p.paymentCode.toLowerCase().includes(lower) ||
        p.employeeName.toLowerCase().includes(lower) ||
        (p.employeeCode && p.employeeCode.toLowerCase().includes(lower)) ||
        (p.reference && p.reference.toLowerCase().includes(lower)) ||
        (p.notes && p.notes.toLowerCase().includes(lower))
    );
  }, [payments, debouncedSearch]);

  // Metrics summary
  const metrics = useMemo(() => {
    let totalCount = 0;
    let totalDisbursed = 0;
    let thisMonthDisbursed = 0;

    const currentYearMonth = getTodayDateString().substring(0, 7);

    filteredPayments.forEach((p) => {
      totalCount += 1;
      const amt = Number(p.amount) || 0;
      totalDisbursed += amt;

      if (p.paymentDate && p.paymentDate.startsWith(currentYearMonth)) {
        thisMonthDisbursed += amt;
      }
    });

    const totalOutstanding = outstandingReports.reduce(
      (sum, item) => sum + (Number(item.outstandingBalance) || 0),
      0
    );

    return {
      totalCount,
      totalDisbursed,
      thisMonthDisbursed,
      totalOutstanding,
    };
  }, [filteredPayments, outstandingReports]);

  // Handlers
  const handlePaymentSuccess = (payment: Payment, receipt: ReceiptDto) => {
    setFeedbackMessage({
      type: "success",
      text: `Payment ${payment.paymentCode} disbursed to ${payment.employeeName} (${formatCurrency(payment.amount)}).`,
    });
    loadPaymentsAndMetrics();
  };

  const handleViewReceipt = (payment: Payment) => {
    setActiveReceiptPaymentId(payment.id);
  };

  const handleFilterThisMonth = () => {
    setStartDate(getFirstDayOfMonth());
    setEndDate(getTodayDateString());
  };

  const handleFilterToday = () => {
    setStartDate(getTodayDateString());
    setEndDate(getTodayDateString());
  };

  const handleClearDateFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  const hasFilter = Boolean(
    selectedEmployeeId || startDate || endDate || debouncedSearch
  );

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
            <CheckCircle
              size={20}
              weight="fill"
              className="shrink-0 text-emerald-600 dark:text-emerald-400"
            />
          ) : (
            <WarningCircle
              size={20}
              weight="fill"
              className="shrink-0 text-rose-600 dark:text-rose-400"
            />
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard size={22} weight="duotone" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Payments
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Disburse employee wages, record partial settlements, and issue official receipts
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus size={16} weight="bold" />}
            className="whitespace-nowrap shadow-sm"
          >
            Make Payment
          </Button>
        </div>
      </div>

      {/* KPI / Metrics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Payments Count</span>
            <Receipt size={18} weight="duotone" className="text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
            {metrics.totalCount}
          </div>
          <div className="text-2xs text-slate-400 mt-1 font-mono">
            Disbursement transactions
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Disbursed</span>
            <Coins size={18} weight="duotone" className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(metrics.totalDisbursed)}
          </div>
          <div className="text-2xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 font-mono">
            In filtered range
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>This Month</span>
            <CalendarBlank size={18} weight="duotone" className="text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 tabular-nums">
            {formatCurrency(metrics.thisMonthDisbursed)}
          </div>
          <div className="text-2xs text-sky-700/80 dark:text-sky-400/80 mt-1 font-mono">
            Month-to-date disbursements
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Remaining Outstanding</span>
            <ClockCounterClockwise size={18} weight="duotone" className="text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {formatCurrency(metrics.totalOutstanding)}
          </div>
          <div className="text-2xs text-amber-700/80 dark:text-amber-400/80 mt-1 font-mono">
            Unpaid wages & stored salary
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Employee & Date Range Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Employee Selector Filter */}
            <div className="relative min-w-[180px]">
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full h-9 pl-8 pr-7 rounded-lg border text-xs font-medium transition-colors appearance-none cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.name}
                  </option>
                ))}
              </select>
              <User
                size={15}
                weight="duotone"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Start Date */}
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="From date"
                aria-label="Filter from start date"
                className="h-9 pl-8 pr-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <CalendarBlank
                size={15}
                weight="duotone"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            <span className="text-xs text-slate-400">to</span>

            {/* End Date */}
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="To date"
                aria-label="Filter to end date"
                className="h-9 pl-8 pr-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <CalendarBlank
                size={15}
                weight="duotone"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Quick Presets */}
            <button
              type="button"
              onClick={handleFilterThisMonth}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              This Month
            </button>

            <button
              type="button"
              onClick={handleFilterToday}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              Today
            </button>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearDateFilters}
                className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                title="Clear date range filters"
              >
                Clear Dates
              </button>
            )}
          </div>

          {/* Search bar & Refresh */}
          <div className="flex items-center gap-2 flex-1 lg:max-w-xs">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search payment code, worker, ref..."
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadPaymentsAndMetrics}
              isLoading={isLoading}
              className="h-9 whitespace-nowrap"
              title="Refresh payments list"
            >
              <ArrowClockwise size={16} />
            </Button>
          </div>
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
            onClick={loadPaymentsAndMetrics}
            className="whitespace-nowrap"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Payment Table */}
      <PaymentTable
        payments={filteredPayments}
        isLoading={isLoading}
        onViewReceipt={handleViewReceipt}
        onMakePayment={() => setIsCreateModalOpen(true)}
        hasFilter={hasFilter}
      />

      {/* Create Payment Modal */}
      <CreatePaymentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        initialEmployeeId={selectedEmployeeId ? Number(selectedEmployeeId) : undefined}
      />

      {/* Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={Boolean(activeReceiptPaymentId || activeReceipt)}
        paymentId={activeReceiptPaymentId}
        receipt={activeReceipt}
        onClose={() => {
          setActiveReceiptPaymentId(null);
          setActiveReceipt(null);
        }}
      />
    </div>
  );
}
