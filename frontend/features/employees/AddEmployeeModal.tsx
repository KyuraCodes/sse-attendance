"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, WarningCircle } from "@phosphor-icons/react";
import { employeeService } from "@/services/employeeService";
import {
  Employee,
  CreateEmployeeRequest,
  RateType,
  RATE_TYPE_LABELS,
  RATE_UNIT_LABELS,
} from "@/types/employee";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employee: Employee) => void;
}

interface FormState {
  name: string;
  dailyRate: string;
  startDate: string;
  phone: string;
  address: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  dailyRate?: string;
  startDate?: string;
  phone?: string;
  general?: string;
}

export const RATE_INPUT_LABELS: Record<RateType, string> = {
  HOURLY: "Kadar Sejam (RM)",
  DAILY: "Kadar Harian (RM)",
  WEEKLY: "Kadar Mingguan (RM)",
  MONTHLY: "Kadar Bulanan (RM)",
};

export const RATE_INPUT_HELPERS: Record<RateType, string> = {
  HOURLY: "Agreed wage per worked hour",
  DAILY: "Agreed wage per worked day",
  WEEKLY: "Agreed wage per worked week",
  MONTHLY: "Agreed wage per worked month",
};

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialFormState: FormState = {
  name: "",
  dailyRate: "",
  startDate: getTodayDateString(),
  phone: "",
  address: "",
  notes: "",
};

export function AddEmployeeModal({
  isOpen,
  onClose,
  onSuccess,
}: AddEmployeeModalProps) {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [rateType, setRateType] = useState<RateType>("DAILY");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetAndClose = () => {
    setFormData(initialFormState);
    setRateType("DAILY");
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialFormState,
        startDate: getTodayDateString(),
      });
      setRateType("DAILY");
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        handleResetAndClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting]);

  if (!isOpen) {
    return null;
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Employee name is required";
    } else if (formData.name.trim().length > 150) {
      newErrors.name = "Name must not exceed 150 characters";
    }

    const rateNum = parseFloat(formData.dailyRate);
    if (!formData.dailyRate.trim()) {
      newErrors.dailyRate = `${RATE_INPUT_LABELS[rateType]} is required`;
    } else if (isNaN(rateNum) || rateNum <= 0) {
      newErrors.dailyRate = "Rate must be greater than 0";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (formData.phone && formData.phone.trim().length > 30) {
      newErrors.phone = "Phone must not exceed 30 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload: CreateEmployeeRequest = {
        name: formData.name.trim(),
        dailyRate: parseFloat(formData.dailyRate),
        rateType: rateType,
        startDate: formData.startDate,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        status: "ACTIVE",
      };

      const created = await employeeService.createEmployee(payload);
      onSuccess(created);
      handleResetAndClose();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create employee. Please check your input and try again.";
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    field: keyof FormState,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-employee-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserPlus size={20} weight="bold" />
            </div>
            <div>
              <h2
                id="add-employee-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Add New Employee
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register an employee into the payroll directory with designated pay rate
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* General Error Banner */}
          {errors.general && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5"
            >
              <WarningCircle size={18} weight="bold" className="shrink-0 text-rose-600 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Employee Name */}
          <Input
            id="emp-name"
            label="Full Name"
            placeholder="e.g. Ahmad bin Abdullah"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={errors.name}
            required
            disabled={isSubmitting}
          />

          {/* Rate Type Selector */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="emp-rate-type"
              className="text-sm font-medium text-slate-800 dark:text-slate-200 select-none"
            >
              Rate Type <span className="text-rose-600 ml-0.5">*</span>
            </label>
            <select
              id="emp-rate-type"
              name="rateType"
              value={rateType}
              onChange={(e) => setRateType(e.target.value as RateType)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-slate-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <option value="HOURLY">Per Jam (Hourly)</option>
              <option value="DAILY">Harian (Daily - default)</option>
              <option value="WEEKLY">Mingguan (Weekly)</option>
              <option value="MONTHLY">Bulanan (Monthly)</option>
            </select>
          </div>

          {/* Pay Rate & Start Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="emp-daily-rate"
              label={RATE_INPUT_LABELS[rateType]}
              placeholder={
                rateType === "HOURLY"
                  ? "e.g. 10.00"
                  : rateType === "DAILY"
                  ? "e.g. 80.00"
                  : rateType === "WEEKLY"
                  ? "e.g. 500.00"
                  : "e.g. 2000.00"
              }
              type="number"
              step="0.01"
              min="0.01"
              value={formData.dailyRate}
              onChange={(e) => handleChange("dailyRate", e.target.value)}
              error={errors.dailyRate}
              required
              disabled={isSubmitting}
              helperText={RATE_INPUT_HELPERS[rateType]}
            />

            <Input
              id="emp-start-date"
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              error={errors.startDate}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Phone Number */}
          <Input
            id="emp-phone"
            label="Phone Number"
            placeholder="e.g. 012-3456789"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            error={errors.phone}
            disabled={isSubmitting}
            helperText="Optional contact number"
          />

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="emp-address"
              className="text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Residential Address
            </label>
            <textarea
              id="emp-address"
              rows={2}
              placeholder="Optional residential address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="emp-notes"
              className="text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Notes / Remarks
            </label>
            <textarea
              id="emp-notes"
              rows={2}
              placeholder="Optional notes regarding role, skill, or storage arrangements"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleResetAndClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Save Employee
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEmployeeModal;
