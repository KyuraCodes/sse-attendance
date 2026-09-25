"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Archive,
  WarningCircle,
  Info,
  CalendarBlank,
  CurrencyCircleDollar,
  User,
} from "@phosphor-icons/react";
import { workRecordService } from "@/services/workRecordService";
import { WorkRecord } from "@/types/workRecord";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface StoreSalaryModalProps {
  isOpen: boolean;
  record: WorkRecord | null;
  onClose: () => void;
  onSuccess: (updated: WorkRecord) => void;
}

const DEFAULT_STORED_NOTE = "Pekerja minta kumpulkan gaji";

export function StoreSalaryModal({
  isOpen,
  record,
  onClose,
  onSuccess,
}: StoreSalaryModalProps) {
  const [note, setNote] = useState<string>(DEFAULT_STORED_NOTE);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNote(record?.notes?.trim() || DEFAULT_STORED_NOTE);
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, record]);

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

  if (!isOpen || !record) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setErrorMessage("Please enter a note explaining why this salary is stored.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const updated = await workRecordService.updateStatus(record.id, {
        status: "STORED",
        notes: note.trim(),
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      let msg = "Failed to mark salary as stored. Please try again.";
      if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetNotes = [
    "Pekerja minta kumpulkan gaji",
    "Simpan atas permintaan pekerja",
    "Kumpul untuk bayaran hujung minggu",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-salary-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Archive size={24} weight="duotone" />
            </div>
            <div>
              <h2
                id="store-salary-modal-title"
                className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                Store Salary (Simpan Gaji)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mark work record as STORED per employee request
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

            {/* Work Record Info Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={18} weight="duotone" className="text-slate-400" />
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {record.employeeName}
                  </span>
                  <span className="text-2xs font-mono font-medium px-1.5 py-0.5 bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 rounded">
                    {record.employeeCode}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(record.amount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5">
                  <CalendarBlank size={16} />
                  <span>Work Date: <strong>{formatDate(record.workDate)}</strong></span>
                </div>
                <div>
                  Daily Rate: <span className="font-mono">{formatCurrency(record.dailyRate)}</span>
                </div>
              </div>
            </div>

            {/* Stored Note Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Reason / Note <span className="text-rose-500">*</span>
              </label>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {presetNotes.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNote(preset)}
                    disabled={isSubmitting}
                    className={cn(
                      "text-2xs px-2.5 py-1 rounded-md border font-medium transition-colors cursor-pointer",
                      note === preset
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter note or reason for storing salary..."
                rows={3}
                disabled={isSubmitting}
                required
                maxLength={255}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border text-sm transition-colors resize-none",
                  "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                  "border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                )}
              />
            </div>

            {/* Outstanding note alert */}
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
              <Info size={18} weight="fill" className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <strong>PRD Rule (BR-008):</strong> Stored salary remains counted as an outstanding obligation owed to the worker until payment is disbursed.
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
              disabled={!note.trim() || isSubmitting}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 focus-visible:ring-indigo-500"
            >
              Mark as STORED
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
