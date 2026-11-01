"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  PencilSimple,
  WarningCircle,
  Clock,
  CalendarBlank,
  CurrencyCircleDollar,
  NotePencil,
} from "@phosphor-icons/react";
import { WorkRecord } from "@/types/workRecord";
import { workRecordService, UpdateWorkRecordPayload } from "@/services/workRecordService";
import { parseOtFromNotes, calculateDefaultOtRate } from "@/lib/otUtils";
import { formatCurrency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface EditWorkRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: WorkRecord | null;
  onUpdated: () => void;
}

export function EditWorkRecordModal({
  isOpen,
  onClose,
  record,
  onUpdated,
}: EditWorkRecordModalProps) {
  const [workDate, setWorkDate] = useState<string>("");
  const [dailyRate, setDailyRate] = useState<string>("");
  const [hoursWorked, setHoursWorked] = useState<string>("");
  const [otHours, setOtHours] = useState<string>("0");
  const [otRate, setOtRate] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isHourly = useMemo(() => {
    if (!record) return false;
    return (
      record.rateType === "HOURLY" ||
      (record.hoursWorked !== undefined && record.hoursWorked !== null && record.hoursWorked > 0)
    );
  }, [record]);

  // Synchronize state when modal opens or record changes
  useEffect(() => {
    if (isOpen && record) {
      setWorkDate(record.workDate ? record.workDate.slice(0, 10) : "");
      setDailyRate(record.dailyRate !== undefined ? String(record.dailyRate) : "0");
      setHoursWorked(
        record.hoursWorked !== undefined && record.hoursWorked !== null
          ? String(record.hoursWorked)
          : ""
      );

      const parsedOt = parseOtFromNotes(record.notes);
      const effectiveOtHours =
        record.otHours !== undefined && record.otHours !== null && record.otHours > 0
          ? record.otHours
          : parsedOt?.otHours ?? 0;

      const fallbackOtRate = calculateDefaultOtRate(
        Number(record.dailyRate) || 0,
        record.rateType || "DAILY"
      );

      const effectiveOtRate =
        record.otRate !== undefined && record.otRate !== null && record.otRate > 0
          ? record.otRate
          : parsedOt?.otRate ?? fallbackOtRate;

      setOtHours(effectiveOtHours > 0 ? String(effectiveOtHours) : "0");
      setOtRate(String(effectiveOtRate));

      const cleanNotes = parsedOt ? parsedOt.cleanNotes : (record.notes || "");
      setNotes(cleanNotes);
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, record]);

  // Handle escape key
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

  // Calculations for live banner
  const numDailyRate = parseFloat(dailyRate) || 0;
  const numHoursWorked = isHourly ? parseFloat(hoursWorked) || 0 : 0;
  const numOtHours = parseFloat(otHours) || 0;
  const numOtRate = parseFloat(otRate) || 0;

  const baseCalculatedAmount = useMemo(() => {
    if (isHourly) {
      return Number((numHoursWorked * numDailyRate).toFixed(2));
    }
    return Number(numDailyRate.toFixed(2));
  }, [isHourly, numHoursWorked, numDailyRate]);

  const otCalculatedAmount = useMemo(() => {
    if (numOtHours <= 0 || numOtRate <= 0) return 0;
    return Number((numOtHours * numOtRate).toFixed(2));
  }, [numOtHours, numOtRate]);

  const totalCalculatedAmount = useMemo(() => {
    return Number((baseCalculatedAmount + otCalculatedAmount).toFixed(2));
  }, [baseCalculatedAmount, otCalculatedAmount]);

  if (!isOpen || !record) {
    return null;
  }

  const isPaid = record.status === "PAID";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPaid) {
      setErrorMessage("Rekod berstatus PAID tidak boleh disunting demi integriti baucar bayaran.");
      return;
    }

    if (!workDate || !/^\d{4}-\d{2}-\d{2}$/.test(workDate.trim())) {
      setErrorMessage("Sila pilih tarikh kerja yang sah (YYYY-MM-DD).");
      return;
    }

    if (isNaN(numDailyRate) || numDailyRate < 0 || numDailyRate > 50000) {
      setErrorMessage("Kadar asas mesti bernilai antara RM 0 dan RM 50,000.");
      return;
    }

    if (isHourly) {
      if (isNaN(numHoursWorked) || numHoursWorked < 0 || numHoursWorked > 24) {
        setErrorMessage("Jam bekerja mesti bernilai antara 0 dan 24 jam.");
        return;
      }
    }

    if (isNaN(numOtHours) || numOtHours < 0 || numOtHours > 24) {
      setErrorMessage("Jam OT mesti bernilai antara 0 dan 24 jam.");
      return;
    }

    if (numOtHours > 0 && (isNaN(numOtRate) || numOtRate < 0 || numOtRate > 1000)) {
      setErrorMessage("Kadar OT sejam mesti bernilai antara RM 0 dan RM 1,000.");
      return;
    }

    if (notes.length > 500) {
      setErrorMessage("Nota tidak boleh melebihi 500 aksara.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: UpdateWorkRecordPayload = {
        workDate: workDate.trim(),
        dailyRate: numDailyRate,
        hoursWorked: isHourly ? numHoursWorked : undefined,
        otHours: numOtHours,
        otRate: numOtHours > 0 ? numOtRate : 0,
        notes: notes.trim() || undefined,
      };

      await workRecordService.update(record.id, payload);
      onUpdated();
      onClose();
    } catch (err: unknown) {
      let msg = "Gagal mengemas kini rekod kerja. Sila cuba lagi.";
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
      aria-labelledby="edit-work-record-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
              <PencilSimple size={20} weight="bold" />
            </div>
            <div>
              <h3
                id="edit-work-record-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Sunting Rekod Kerja
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {record.employeeName}
                </span>
                <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {record.employeeCode}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Error Alert Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2"
            >
              <WarningCircle
                size={16}
                weight="fill"
                className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400"
              />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Paid Warning Banner */}
          {isPaid && (
            <div
              role="alert"
              className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2"
            >
              <WarningCircle
                size={16}
                weight="fill"
                className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
              />
              <span>
                Rekod ini telah dibayar (PAID) dan dikunci demi ketepatan baucar pembayaran.
              </span>
            </div>
          )}

          {/* Work Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tarikh Kerja <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                disabled={isSubmitting || isPaid}
                required
                className="font-mono text-xs pl-9"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <CalendarBlank size={16} weight="duotone" />
              </div>
            </div>
          </div>

          {/* Rates and Hours Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Base Rate */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kadar Asas (RM) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="50000"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  disabled={isSubmitting || isPaid}
                  required
                  placeholder="0.00"
                  className="font-mono text-xs pl-9"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <CurrencyCircleDollar size={16} weight="duotone" />
                </div>
              </div>
            </div>

            {/* If hourly: Hours Worked */}
            {isHourly && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Jam Bekerja Biasa <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    disabled={isSubmitting || isPaid}
                    required
                    placeholder="8.0"
                    className="font-mono text-xs pl-9"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Clock size={16} weight="duotone" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Overtime (OT) Section */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Clock size={15} weight="bold" className="text-amber-500" />
              <span>Kerja Lebih Masa (Overtime / OT)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Jam OT (0 - 24)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="any"
                  value={otHours}
                  onChange={(e) => setOtHours(e.target.value)}
                  disabled={isSubmitting || isPaid}
                  placeholder="0.0"
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Kadar OT (RM/jam)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={otRate}
                  onChange={(e) => setOtRate(e.target.value)}
                  disabled={isSubmitting || isPaid}
                  placeholder="0.00"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Real-time Calculation Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                Pengiraan Masa Nyata
              </span>
              <span className="font-mono text-2xs text-emerald-700 dark:text-emerald-400 tabular-nums">
                {isHourly
                  ? `${numHoursWorked} jam @ RM ${numDailyRate.toFixed(2)}/jam`
                  : `Kadar Asas: RM ${numDailyRate.toFixed(2)}`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="block text-2xs text-slate-500 dark:text-slate-400 font-medium">
                  Gaji Asas
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatCurrency(baseCalculatedAmount)}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="block text-2xs text-amber-600 dark:text-amber-400 font-medium">
                  Gaji OT
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-amber-600 dark:text-amber-400 tabular-nums">
                  +{formatCurrency(otCalculatedAmount)}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
                <span className="block text-2xs text-emerald-100 font-medium">
                  Jumlah Baru
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-white tabular-nums">
                  {formatCurrency(totalCalculatedAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <NotePencil size={14} className="text-slate-400" />
                Nota Tambahan
              </span>
              <span className="text-2xs text-slate-400 font-normal">
                {notes.length}/500 aksara
              </span>
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting || isPaid}
              placeholder="Contoh: Kerja lebih masa projek pembaikan paip utama..."
              className={cn(
                "w-full px-3 py-2 text-xs rounded-xl border transition-colors duration-150 resize-none",
                "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                "border-slate-300 dark:border-slate-700",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              )}
            />
            <p className="text-2xs text-slate-400 mt-1">
              Maklumat OT akan disimpan secara automatik dalam nota rekod kerja.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting || isPaid}
              leftIcon={<PencilSimple size={14} weight="bold" />}
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
