"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  CreditCard,
  User,
  CalendarBlank,
  CurrencyCircleDollar,
  WarningCircle,
  FileText,
  CircleNotch,
  Receipt,
  CheckCircle,
  ArrowRight,
  Money,
} from "@phosphor-icons/react";
import { employeeService } from "@/services/employeeService";
import { paymentService } from "@/services/paymentService";
import { Employee } from "@/types/employee";
import { Payment, CreatePaymentRequest, ReceiptDto, OutstandingReportDto, PaymentMethod } from "@/types/payment";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, cn } from "@/lib/utils";
import { PaymentReceiptModal } from "./PaymentReceiptModal";

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: Payment, receipt: ReceiptDto) => void;
  initialEmployeeId?: number;
}

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function CreatePaymentModal({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeId,
}: CreatePaymentModalProps) {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [outstandingMap, setOutstandingMap] = useState<Record<number, OutstandingReportDto>>({});
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Successfully created receipt to open in receipt modal
  const [completedReceipt, setCompletedReceipt] = useState<ReceiptDto | null>(null);

  const loadInitialData = useCallback(async () => {
    setIsLoadingData(true);
    setErrorMessage(null);
    try {
      const [empList, outstandingList] = await Promise.all([
        employeeService.getEmployees(undefined, "ACTIVE"),
        paymentService.getOutstandingReport(),
      ]);

      setEmployees(empList);

      const map: Record<number, OutstandingReportDto> = {};
      outstandingList.forEach((item) => {
        map[item.employeeId] = item;
      });
      setOutstandingMap(map);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load employee and balance information.";
      setErrorMessage(msg);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setEmployeeId(initialEmployeeId ? String(initialEmployeeId) : "");
      setPaymentDate(getTodayDateString());
      setAmount("");
      setPaymentMethod("CASH");
      setReference("");
      setNotes("");
      setErrorMessage(null);
      setCompletedReceipt(null);
      loadInitialData();
    }
  }, [isOpen, initialEmployeeId, loadInitialData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting && !completedReceipt) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, completedReceipt, onClose]);

  // Selected employee information and balance
  const selectedEmp = useMemo(() => {
    return employees.find((e) => String(e.id) === employeeId);
  }, [employees, employeeId]);

  const selectedBalanceInfo = useMemo(() => {
    if (!employeeId) return null;
    return outstandingMap[Number(employeeId)] || null;
  }, [outstandingMap, employeeId]);

  const outstandingBalance = selectedBalanceInfo?.outstandingBalance ?? 0;

  // Live amount validation
  const amountValidation = useMemo(() => {
    if (!amount.trim()) {
      return { isValid: false, error: null };
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      return { isValid: false, error: "Payment amount must be greater than RM 0.00" };
    }
    if (parsed > outstandingBalance) {
      return {
        isValid: false,
        error: `Amount exceeds outstanding balance of ${formatCurrency(outstandingBalance)}`,
      };
    }
    return { isValid: true, error: null };
  }, [amount, outstandingBalance]);

  const handlePayFullBalance = () => {
    if (outstandingBalance > 0) {
      setAmount(outstandingBalance.toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setErrorMessage("Please select an employee.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Please enter a valid amount greater than RM 0.00.");
      return;
    }

    if (parsedAmount > outstandingBalance) {
      setErrorMessage(`Amount exceeds outstanding balance of ${formatCurrency(outstandingBalance)}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: CreatePaymentRequest = {
        employeeId: Number(employeeId),
        paymentDate,
        amount: parsedAmount,
        paymentMethod,
        reference: reference.trim() ? reference.trim() : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      const createdPayment = await paymentService.createPayment(payload);

      // Fetch the official receipt
      const receipt = await paymentService.getReceipt(createdPayment.id);

      // Notify parent to refresh payments list
      onSuccess(createdPayment, receipt);

      // Transition to Receipt view
      setCompletedReceipt(receipt);
    } catch (err: unknown) {
      let msg = "Failed to process payment. Please try again.";
      if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  // If receipt modal is active after successful creation
  if (completedReceipt) {
    return (
      <PaymentReceiptModal
        isOpen={true}
        receipt={completedReceipt}
        onClose={() => {
          setCompletedReceipt(null);
          onClose();
        }}
      />
    );
  }

  const numericAmount = parseFloat(amount) || 0;
  const remainingAfterPayment = Math.max(0, outstandingBalance - numericAmount);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard size={24} weight="duotone" />
            </div>
            <div>
              <h2
                id="create-payment-modal-title"
                className="text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                Make Payment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Disburse salary with automatic FIFO work record settlement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-300 text-sm"
              >
                <WarningCircle size={20} weight="fill" className="shrink-0 mt-0.5" />
                <div className="flex-1 text-xs sm:text-sm font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Employee <span className="text-rose-500">*</span>
              </label>
              {isLoadingData ? (
                <div className="flex items-center gap-2 py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-500">
                  <CircleNotch size={16} className="animate-spin text-emerald-600" />
                  Loading employees and outstanding balances...
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={employeeId}
                    onChange={(e) => {
                      setEmployeeId(e.target.value);
                      setAmount("");
                    }}
                    disabled={isSubmitting}
                    required
                    className={cn(
                      "w-full h-10 px-3 pr-8 rounded-lg border text-sm font-medium transition-colors appearance-none cursor-pointer",
                      "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                      "border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
                      !employeeId && "text-slate-400 dark:text-slate-500"
                    )}
                  >
                    <option value="" disabled>
                      Choose an employee...
                    </option>
                    {employees.map((emp) => {
                      const bal = outstandingMap[emp.id]?.outstandingBalance ?? 0;
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.employeeCode} - {emp.name} (Balance: {formatCurrency(bal)})
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <User size={16} weight="duotone" />
                  </div>
                </div>
              )}
            </div>

            {/* Outstanding Balance Info Banner */}
            {selectedEmp && (
              <div
                className={cn(
                  "p-3.5 rounded-xl border flex flex-col gap-2",
                  outstandingBalance > 0
                    ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Current Outstanding Balance
                  </div>
                  <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(outstandingBalance)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-slate-500 dark:text-slate-400">
                  <span>
                    Unpaid Days:{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {selectedBalanceInfo?.totalWorkDaysUnpaid ?? 0}
                    </strong>
                  </span>
                  {selectedBalanceInfo && (selectedBalanceInfo.storedAmount ?? 0) > 0 && (
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      Includes {formatCurrency(selectedBalanceInfo.storedAmount)} stored ({selectedBalanceInfo.storedCount ?? 0} days)
                    </span>
                  )}
                </div>

                {outstandingBalance === 0 && (
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-medium pt-1 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <WarningCircle size={14} weight="bold" />
                    <span>This worker has zero outstanding balance to pay.</span>
                  </div>
                )}
              </div>
            )}

            {/* Amount input with Quick Fill */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Amount (RM) <span className="text-rose-500">*</span>
                </label>
                {outstandingBalance > 0 && (
                  <button
                    type="button"
                    onClick={handlePayFullBalance}
                    disabled={isSubmitting}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Pay Full Balance ({formatCurrency(outstandingBalance)})
                  </button>
                )}
              </div>

              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={outstandingBalance > 0 ? outstandingBalance : undefined}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting || !employeeId || outstandingBalance <= 0}
                  required
                  error={amountValidation.error || undefined}
                  className="font-mono text-base font-semibold pl-9"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-slate-400 pointer-events-none">
                  RM
                </span>
              </div>

              {/* Remaining calculation preview */}
              {amountValidation.isValid && numericAmount > 0 && (
                <div className="mt-1.5 text-2xs text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
                  <span>Remaining balance after payment:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                    {formatCurrency(remainingAfterPayment)}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Date & Method Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    max="2099-12-31"
                    disabled={isSubmitting}
                    required
                    className="pl-9 text-xs font-medium"
                  />
                  <CalendarBlank
                    size={16}
                    weight="duotone"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  disabled={isSubmitting}
                  required
                  className="w-full h-10 px-3 rounded-lg border text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="DUITNOW">DuitNow</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Reference / Transaction ID (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. MBB-Ref-12345 or Cheque No."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={isSubmitting}
                maxLength={100}
                className="text-xs"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Notes (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. Mid-month disbursement or worker note"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                maxLength={255}
                className="text-xs"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
              className="whitespace-nowrap"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={
                !employeeId ||
                outstandingBalance <= 0 ||
                !amountValidation.isValid ||
                isSubmitting
              }
              rightIcon={<ArrowRight size={16} weight="bold" />}
              className="whitespace-nowrap"
            >
              Process Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePaymentModal;
