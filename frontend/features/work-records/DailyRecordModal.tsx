"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  User,
  CalendarBlank,
  CurrencyCircleDollar,
  WarningCircle,
  FileText,
  CircleNotch,
} from "@phosphor-icons/react";
import { employeeService } from "@/services/employeeService";
import { workRecordService } from "@/services/workRecordService";
import {
  Employee,
  RateType,
  RATE_TYPE_LABELS,
  RATE_UNIT_LABELS,
} from "@/types/employee";
import { WorkRecord, CreateWorkRecordRequest } from "@/types/workRecord";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, cn } from "@/lib/utils";
import { getRateBadgeClass } from "@/features/employees/EmployeeTable";

interface DailyRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: WorkRecord) => void;
  initialDate?: string;
}

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function DailyRecordModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
}: DailyRecordModalProps) {
  const [workDate, setWorkDate] = useState<string>(initialDate || getTodayDateString());
  const [employeeId, setEmployeeId] = useState<string>("");
  const [hoursWorked, setHoursWorked] = useState<string>("8");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchActiveEmployees = useCallback(async () => {
    setIsLoadingEmployees(true);
    setErrorMessage(null);
    try {
      const activeEmps = await employeeService.getEmployees(undefined, "ACTIVE");
      setEmployees(activeEmps);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load active employees.";
      setErrorMessage(msg);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setWorkDate(initialDate || getTodayDateString());
      setEmployeeId("");
      setHoursWorked("8");
      setCustomAmount("");
      setNotes("");
      setErrorMessage(null);
      fetchActiveEmployees();
    }
  }, [isOpen, initialDate, fetchActiveEmployees]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const selectedEmployee = employees.find((emp) => String(emp.id) === employeeId);
  const rateType: RateType = selectedEmployee?.rateType || "DAILY";
  const dailyRate = selectedEmployee ? Number(selectedEmployee.dailyRate) || 0 : 0;

  const handleEmployeeChange = (newEmpId: string) => {
    setEmployeeId(newEmpId);
    setErrorMessage(null);
    const emp = employees.find((e) => String(e.id) === newEmpId);
    if (emp) {
      const rType = emp.rateType || "DAILY";
      const rateNum = Number(emp.dailyRate) || 0;
      if (rType === "HOURLY") {
        setHoursWorked("8");
        setCustomAmount(Number((8 * rateNum).toFixed(2)).toString());
      } else if (rType === "WEEKLY") {
        setHoursWorked("");
        setCustomAmount(Number((rateNum / 6).toFixed(2)).toString());
      } else if (rType === "MONTHLY") {
        setHoursWorked("");
        setCustomAmount(Number((rateNum / 26).toFixed(2)).toString());
      } else {
        setHoursWorked("");
        setCustomAmount(Number(rateNum.toFixed(2)).toString());
      }
    } else {
      setHoursWorked("8");
      setCustomAmount("");
    }
  };

  const hourlyHours = parseFloat(hoursWorked) || 0;
  const hourlyCalculatedAmount = Number((hourlyHours * dailyRate).toFixed(2));

  const finalCalculatedAmount = useMemo(() => {
    if (!selectedEmployee) return 0;
    if (rateType === "HOURLY") {
      return hourlyCalculatedAmount;
    }
    if (rateType === "WEEKLY" || rateType === "MONTHLY") {
      const parsed = parseFloat(customAmount);
      return !isNaN(parsed) && parsed >= 0
        ? parsed
        : rateType === "WEEKLY"
        ? Number((dailyRate / 6).toFixed(2))
        : Number((dailyRate / 26).toFixed(2));
    }
    const parsed = parseFloat(customAmount);
    return !isNaN(parsed) && parsed >= 0 ? parsed : dailyRate;
  }, [selectedEmployee, rateType, hourlyCalculatedAmount, customAmount, dailyRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setErrorMessage("Please select an employee.");
      return;
    }
    if (!workDate) {
      setErrorMessage("Please select a work date.");
      return;
    }
    if (!selectedEmployee) {
      setErrorMessage("Selected employee was not found.");
      return;
    }

    let hoursToSend: number | undefined = undefined;
    let amountToSend: number;

    if (rateType === "HOURLY") {
      const h = parseFloat(hoursWorked);
      if (isNaN(h) || h <= 0) {
        setErrorMessage("Sila masukkan jam bekerja yang sah (sekurang-kurangnya 0.5 jam).");
        return;
      }
      hoursToSend = h;
      amountToSend = Number((h * dailyRate).toFixed(2));
    } else if (rateType === "WEEKLY" || rateType === "MONTHLY") {
      const a = parseFloat(customAmount);
      if (isNaN(a) || a <= 0) {
        setErrorMessage("Sila masukkan amaun gaji yang sah.");
        return;
      }
      amountToSend = Number(a.toFixed(2));
    } else {
      // DAILY
      const a = parseFloat(customAmount);
      amountToSend = !isNaN(a) && a > 0 ? Number(a.toFixed(2)) : dailyRate;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: CreateWorkRecordRequest = {
        employeeId: Number(employeeId),
        workDate,
        hoursWorked: hoursToSend,
        amount: amountToSend,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      const created = await workRecordService.createWorkRecord(payload);

      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      let msg = "Failed to create work record. Please try again.";
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-record-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarBlank size={24} weight="duotone" />
            </div>
            <div>
              <h2
                id="daily-record-modal-title"
                className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                Record Daily Work
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create a single daily attendance and salary record
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-300 text-sm"
              >
                <WarningCircle size={20} weight="fill" className="shrink-0 mt-0.5" />
                <div className="flex-1 text-xs sm:text-sm font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Date input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  max="2099-12-31"
                  disabled={isSubmitting}
                  required
                  className="w-full pl-9 font-medium"
                />
                <CalendarBlank
                  size={18}
                  weight="duotone"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Employee <span className="text-rose-500">*</span>
              </label>
              {isLoadingEmployees ? (
                <div className="flex items-center gap-2 py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-500">
                  <CircleNotch size={16} className="animate-spin text-emerald-600" />
                  Loading active employees...
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={employeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
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
                      Select an active worker...
                    </option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.name} ({formatCurrency(emp.dailyRate)} / {RATE_UNIT_LABELS[emp.rateType] || "hari"})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <User size={16} weight="duotone" />
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Rate / Hourly Inputs */}
            {selectedEmployee && rateType === "HOURLY" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Jam Bekerja <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    disabled={isSubmitting}
                    required
                    placeholder="8"
                  />
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-900 dark:text-emerald-200">
                  Pengiraan: {hoursWorked || 0} jam x RM {dailyRate.toFixed(2)} = RM {hourlyCalculatedAmount.toFixed(2)}
                </div>
              </div>
            )}

            {selectedEmployee && rateType === "WEEKLY" && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Amaun Gaji Harian (RM) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    disabled={isSubmitting}
                    required
                    placeholder={(dailyRate / 6).toFixed(2)}
                  />
                </div>
                <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs text-sky-900 dark:text-sky-200">
                  Kadar cadangan prorata (6 hari seminggu): <strong className="font-mono">{formatCurrency(dailyRate / 6)}</strong> (Gaji mingguan: {formatCurrency(dailyRate)})
                </div>
              </div>
            )}

            {selectedEmployee && rateType === "MONTHLY" && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Amaun Gaji Harian (RM) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    disabled={isSubmitting}
                    required
                    placeholder={(dailyRate / 26).toFixed(2)}
                  />
                </div>
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-purple-900 dark:text-purple-200">
                  Kadar cadangan prorata (26 hari sebulan): <strong className="font-mono">{formatCurrency(dailyRate / 26)}</strong> (Gaji bulanan: {formatCurrency(dailyRate)})
                </div>
              </div>
            )}

            {/* Rate Preview Card */}
            {selectedEmployee && (
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CurrencyCircleDollar size={24} weight="duotone" className="text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>Standard Rate</span>
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.2 rounded text-2xs font-semibold border",
                          getRateBadgeClass(rateType)
                        )}
                      >
                        {RATE_TYPE_LABELS[rateType] || "Harian"}
                      </span>
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatCurrency(selectedEmployee.dailyRate)} / {RATE_UNIT_LABELS[rateType] || "hari"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Calculated Amount
                  </div>
                  <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(finalCalculatedAmount)}
                  </div>
                </div>
              </div>
            )}

            {/* Notes input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Notes (Optional)
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. Overtime or site note"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={255}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={!employeeId || isSubmitting}
              className="w-full sm:w-auto"
            >
              Record Work
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
