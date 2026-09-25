"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  WarningCircle,
  Prohibit,
  CalendarBlank,
  User,
} from "@phosphor-icons/react";
import { workRecordService } from "@/services/workRecordService";
import { WorkRecord } from "@/types/workRecord";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface VoidRecordModalProps {
  isOpen: boolean;
  record: WorkRecord | null;
  onClose: () => void;
  onSuccess: (updated: WorkRecord) => void;
}

export function VoidRecordModal({
  isOpen,
  record,
  onClose,
  onSuccess,
}: VoidRecordModalProps) {
  const [reason, setReason] = useState<string>("Salah rekod kehadiran");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("Salah rekod kehadiran");
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

  const handleVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const updated = await workRecordService.updateStatus(record.id, {
        status: "VOID",
        notes: reason.trim() ? reason.trim() : "Voided by user",
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      let msg = "Failed to void work record. Please try again.";
      if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="void-record-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Prohibit size={24} weight="bold" />
            </div>
            <div>
              <h2
                id="void-record-modal-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Void Work Record
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cancel this attendance and wage entry
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

        {/* Content */}
        <form onSubmit={handleVoid} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-300 text-sm"
              >
                <WarningCircle size={20} weight="fill" className="shrink-0 mt-0.5" />
                <div className="flex-1 text-xs font-medium">{errorMessage}</div>
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to void this work record? This will mark it as VOID in audit logs and exclude it from payable salary.
            </p>

            {/* Target Record Details */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                  <User size={16} className="text-slate-400" />
                  <span>{record.employeeName}</span>
                  <span className="font-mono text-slate-500">({record.employeeCode})</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(record.amount)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-2xs text-slate-500 dark:text-slate-400">
                <CalendarBlank size={14} />
                <span>Date: {formatDate(record.workDate)}</span>
                <span className="mx-1">•</span>
                <span>Current Status: {record.status}</span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Reason for Voiding
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Salah rekod kehadiran"
                maxLength={255}
                disabled={isSubmitting}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
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
              variant="danger"
              size="md"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Confirm Void
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
