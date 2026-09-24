"use client";

import React, { useState } from "react";
import {
  GearSix,
  Buildings,
  Palette,
  CurrencyCircleDollar,
  ShieldCheck,
  CheckCircle,
  Sun,
  Moon,
  FloppyDisk,
} from "@phosphor-icons/react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/Button";
import { COMPANY_NAME, COMPANY_SHORT, SYSTEM_NAME } from "@/lib/constants";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  // Settings local state
  const [companyName, setCompanyName] = useState(COMPANY_NAME);
  const [shortName, setShortName] = useState(COMPANY_SHORT);
  const [ssmNumber, setSsmNumber] = useState("202601002345-M");
  const [companyAddress, setCompanyAddress] = useState(
    "Lot 12, Kawasan Perindustrian, 40000 Shah Alam, Selangor"
  );
  const [currency, setCurrency] = useState("MYR");
  const [defaultRate, setDefaultRate] = useState("80.00");
  const [autoFifo, setAutoFifo] = useState(true);
  const [allowStoredWage, setAllowStoredWage] = useState(true);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
            <GearSix size={16} weight="bold" />
            <span>System Configuration</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Settings & Preferences
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure enterprise details, visual theme, and daily wage parameters
          </p>
        </div>

        {savedSuccess && (
          <div
            role="status"
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-xs animate-in fade-in"
          >
            <CheckCircle size={16} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Appearance & Theme */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Palette size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Appearance & Theme Mode
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose between Light and Dark interface modes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                theme === "light"
                  ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
                <Sun size={20} weight="bold" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Light Mode
                  </span>
                  {theme === "light" && (
                    <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Crisp high-contrast layout optimized for day shifts and offices
                </p>
              </div>
            </button>

            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                theme === "dark"
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-800 text-slate-200 dark:bg-slate-700 dark:text-slate-200 shrink-0">
                <Moon size={20} weight="bold" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Dark Mode
                  </span>
                  {theme === "dark" && (
                    <CheckCircle size={18} weight="fill" className="text-emerald-500" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Gentle on the eyes for night site supervisory tasks and low-light environments
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Enterprise Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Buildings size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Company & Business Identity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official entity information displayed on wage receipts and statements
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label htmlFor="company-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Company Name
              </label>
              <input
                id="company-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label htmlFor="company-short" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Company Abbreviation
              </label>
              <input
                id="company-short"
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>

            <div>
              <label htmlFor="ssm-number" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                SSM Registration Number
              </label>
              <input
                id="ssm-number"
                type="text"
                value={ssmNumber}
                onChange={(e) => setSsmNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label htmlFor="currency-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                System Currency
              </label>
              <select
                id="currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="MYR">MYR (Ringgit Malaysia - RM)</option>
                <option value="SGD">SGD (Singapore Dollar - S$)</option>
                <option value="USD">USD (US Dollar - $)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="company-address" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Operating Site / Office Address
              </label>
              <textarea
                id="company-address"
                rows={2}
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Payroll & Attendance Rules */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CurrencyCircleDollar size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Daily Wage & Allocation Logic
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Default rate parameters and FIFO settlement algorithms
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="max-w-xs">
              <label htmlFor="default-daily-rate" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Daily Wage Rate (RM)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                  RM
                </span>
                <input
                  id="default-daily-rate"
                  type="number"
                  step="0.01"
                  min="1"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Automatic FIFO Payment Allocation
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Disburses payments chronologically against the oldest unpaid or stored work records first
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoFifo}
                onChange={(e) => setAutoFifo(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Stored Wages (Simpan Gaji) Feature
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enables workers to store daily earnings as company savings until requested
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowStoredWage}
                onChange={(e) => setAllowStoredWage(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Security & System Audit Information */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Security & Platform Diagnostics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authentication status and system specifications
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Software Version:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">v1.0.0 (SSE Enterprise)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Security Token:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">JWT Stateless (HS256)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Audit Log Compliance:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">100% Immutable Append-Only</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<FloppyDisk size={16} weight="bold" />}
            className="whitespace-nowrap shadow-xs"
          >
            Save All Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
