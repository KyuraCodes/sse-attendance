"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  UsersThree,
  CheckSquare,
  Square,
  MagnifyingGlass,
  WarningCircle,
  CircleNotch,
  CalendarBlank,
  CurrencyCircleDollar,
} from "@phosphor-icons/react";
import { employeeService } from "@/services/employeeService";
import { workRecordService } from "@/services/workRecordService";
import { Employee } from "@/types/employee";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency, cn } from "@/lib/utils";

interface BulkRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number, totalAmount: number) => void;
  initialDate?: string;
}

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function BulkRecordModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
}: BulkRecordModalProps) {
  const [workDate, setWorkDate] = useState<string>(initialDate || getTodayDateString());
  const [notes, setNotes] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load active employees when modal opens
  const fetchActiveEmployees = useCallback(async () => {
    setIsLoadingEmployees(true);
    setErrorMessage(null);
    try {
      const activeEmps = await employeeService.getEmployees(undefined, "ACTIVE");
      setEmployees(activeEmps);
      // By default, select all active workers for quick CEO one-click flow
      setSelectedIds(new Set(activeEmps.map((emp) => emp.id)));
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load active employees. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setWorkDate(initialDate || getTodayDateString());
      setNotes("");
      setSearchTerm("");
      setErrorMessage(null);
      fetchActiveEmployees();
    }
  }, [isOpen, initialDate, fetchActiveEmployees]);

  // Handle Escape key to close
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

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) {
      return employees;
    }
    const lower = searchTerm.toLowerCase().trim();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(lower) ||
        emp.employeeCode.toLowerCase().includes(lower)
    );
  }, [employees, searchTerm]);

  // Toggle single employee selection
  const handleToggleWorker = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all currently filtered employees
  const handleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredEmployees.forEach((emp) => next.add(emp.id));
      return next;
    });
  };

  // Deselect all currently filtered employees
  const handleDeselectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredEmployees.forEach((emp) => next.delete(emp.id));
      return next;
    });
  };

  // Calculate live tally
  const { selectedCount, totalAmount } = useMemo(() => {
    let count = 0;
    let sum = 0;
    employees.forEach((emp) => {
      if (selectedIds.has(emp.id)) {
        count += 1;
        sum += Number(emp.dailyRate) || 0;
      }
    });
    return { selectedCount: count, totalAmount: sum };
  }, [employees, selectedIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDate) {
      setErrorMessage("Please select a valid work date.");
      return;
    }
    if (selectedIds.size === 0) {
      setErrorMessage("Please select at least one worker to record work.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await workRecordService.bulkCreateWorkRecords({
        workDate,
        employeeIds: Array.from(selectedIds),
        notes: notes.trim() ? notes.trim() : undefined,
      });

      onSuccess(selectedCount, totalAmount);
      onClose();
    } catch (err: unknown) {
      let msg = "Failed to record bulk work. Please try again.";
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

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedIds.has(emp.id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-record-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UsersThree size={24} weight="duotone" />
            </div>
            <div>
              <h2
                id="bulk-record-modal-title"
                className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                Record Work (Bulk)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check off active workers present on the selected date
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

        {/* Content & Form */}
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

            {/* Date and Optional Notes inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  General Notes (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Regular site work"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={255}
                />
              </div>
            </div>

            {/* Live Tally Bar */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CurrencyCircleDollar size={22} weight="duotone" className="text-emerald-700 dark:text-emerald-400" />
                <span className="text-xs sm:text-sm font-medium text-emerald-900 dark:text-emerald-200">
                  Selected: <strong className="font-bold text-emerald-800 dark:text-emerald-300">{selectedCount}</strong> workers
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 mr-2">Total Amount:</span>
                <span className="text-base sm:text-lg font-bold font-mono text-emerald-800 dark:text-emerald-300 tabular-nums">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Worker Search & Select All/Deselect Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search worker by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-9 text-xs"
                />
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={allFilteredSelected ? handleDeselectAll : handleSelectAll}
                  disabled={isSubmitting || filteredEmployees.length === 0}
                  className="whitespace-nowrap"
                  leftIcon={allFilteredSelected ? <Square size={14} /> : <CheckSquare size={14} />}
                >
                  {allFilteredSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </div>

            {/* Worker Checklist */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-900/40">
              {isLoadingEmployees ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <CircleNotch size={24} className="animate-spin text-emerald-600" />
                  <span className="text-xs">Loading active employees...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  {employees.length === 0
                    ? "No active employees found in system."
                    : "No workers match your search."}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-800/70">
                  {filteredEmployees.map((emp) => {
                    const isSelected = selectedIds.has(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => !isSubmitting && handleToggleWorker(emp.id)}
                        className={cn(
                          "px-4 py-3 flex items-center justify-between cursor-pointer transition-colors select-none",
                          isSelected
                            ? "bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            : "hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleWorker(emp.id)}
                            disabled={isSubmitting}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                {emp.name}
                              </span>
                              <span className="text-2xs font-mono font-medium px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                                {emp.employeeCode}
                              </span>
                            </div>
                            {emp.phone && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {emp.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                            {formatCurrency(emp.dailyRate)}
                          </span>
                          <div className="text-2xs text-slate-400">Daily Rate</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              {selectedCount} of {employees.length} workers selected
            </span>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
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
                disabled={selectedCount === 0 || isSubmitting}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Record {selectedCount} Workers ({formatCurrency(totalAmount)})
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
