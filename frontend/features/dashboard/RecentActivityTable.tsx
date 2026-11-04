"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Money,
  ArrowRight,
  CreditCard,
  Bank,
  DeviceMobile,
} from "@phosphor-icons/react";
import { DashboardWorkRecord, DashboardPayment } from "@/types/dashboard";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { STATUS_CONFIG, RecordStatus } from "@/lib/constants";

interface RecentActivityTableProps {
  workRecords: DashboardWorkRecord[];
  payments: DashboardPayment[];
  isLoading?: boolean;
}

const TABS = ["all", "work", "payments"] as const;
type ActivityTab = (typeof TABS)[number];

// Shared mobile tab styling: 44px tap height for one-handed use on site.
const MOBILE_TAB_BASE =
  "flex-1 min-h-[44px] py-2 px-2.5 text-xs font-semibold rounded-md transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-800 cursor-pointer";
const MOBILE_TAB_ACTIVE = "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs";
const MOBILE_TAB_IDLE = "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100";

// "Lihat semua" link: 44px tap area on touch, compact on mouse/trackpad.
// Negative margin keeps the label visually aligned with the card edge.
const VIEW_ALL_LINK =
  "inline-flex items-center gap-1 -mr-2 px-2 min-h-[44px] sm:pointer-fine:min-h-[32px] shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 active:scale-[0.97] transition-all rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

const TABLE_HEAD_ROW =
  "border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400";

export function RecentActivityTable({
  workRecords,
  payments,
  isLoading = false,
}: RecentActivityTableProps) {
  const [activeTab, setActiveTab] = useState<ActivityTab>("all");
  const records = Array.isArray(workRecords) ? workRecords : [];
  const paymentList = Array.isArray(payments) ? payments : [];

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const currentIndex = TABS.indexOf(activeTab);
      const nextIndex =
        e.key === "ArrowRight"
          ? (currentIndex + 1) % TABS.length
          : (currentIndex - 1 + TABS.length) % TABS.length;
      const nextTab = TABS[nextIndex];
      setActiveTab(nextTab);
      document.getElementById(`tab-recent-${nextTab}`)?.focus();
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toUpperCase()) {
      case "CASH":
        return <Money size={14} weight="bold" className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />;
      case "BANK_TRANSFER":
        return <Bank size={14} weight="bold" className="text-sky-600 dark:text-sky-400" aria-hidden="true" />;
      case "DUITNOW":
        return <DeviceMobile size={14} weight="bold" className="text-pink-600 dark:text-pink-400" aria-hidden="true" />;
      default:
        return <CreditCard size={14} weight="bold" className="text-slate-500" aria-hidden="true" />;
    }
  };

  const formatPaymentMethod = (method: string) => {
    switch (method?.toUpperCase()) {
      case "CASH":
        return "Tunai";
      case "BANK_TRANSFER":
        return "Pindahan Bank";
      case "DUITNOW":
        return "DuitNow";
      default:
        return method || "Lain-lain";
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs animate-pulse motion-reduce:animate-none"
          >
            <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile/Responsive View Toggle */}
      <div
        role="tablist"
        aria-label="Pilihan paparan aktiviti terkini"
        onKeyDown={handleTabKeyDown}
        className="flex sm:hidden items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-1"
      >
        <button
          type="button"
          role="tab"
          id="tab-recent-all"
          tabIndex={activeTab === "all" ? 0 : -1}
          aria-selected={activeTab === "all"}
          aria-controls="panel-recent-work panel-recent-payments"
          onClick={() => setActiveTab("all")}
          className={cn(MOBILE_TAB_BASE, activeTab === "all" ? MOBILE_TAB_ACTIVE : MOBILE_TAB_IDLE)}
        >
          Semua
        </button>
        <button
          type="button"
          role="tab"
          id="tab-recent-work"
          tabIndex={activeTab === "work" ? 0 : -1}
          aria-selected={activeTab === "work"}
          aria-controls="panel-recent-work"
          onClick={() => setActiveTab("work")}
          className={cn(MOBILE_TAB_BASE, activeTab === "work" ? MOBILE_TAB_ACTIVE : MOBILE_TAB_IDLE)}
        >
          Rekod Kerja
        </button>
        <button
          type="button"
          role="tab"
          id="tab-recent-payments"
          tabIndex={activeTab === "payments" ? 0 : -1}
          aria-selected={activeTab === "payments"}
          aria-controls="panel-recent-payments"
          onClick={() => setActiveTab("payments")}
          className={cn(MOBILE_TAB_BASE, activeTab === "payments" ? MOBILE_TAB_ACTIVE : MOBILE_TAB_IDLE)}
        >
          Bayaran
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Rekod Kerja Terkini Table Card */}
        {/* @container: columns collapse by card width, not viewport, so the
            table stays scroll-free in the narrow lg two-column layout too. */}
        {(activeTab === "all" || activeTab === "work") && (
          <div
            id="panel-recent-work"
            role="region"
            aria-label="Rekod Kerja Terkini"
            className="@container bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden min-w-0"
          >
            {/* Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CalendarCheck size={18} weight="duotone" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Rekod Kerja Terkini
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Log kehadiran dan kerja harian terkini
                  </p>
                </div>
              </div>

              <Link href="/work-records" className={VIEW_ALL_LINK}>
                <span>Lihat semua</span>
                <ArrowRight size={13} weight="bold" aria-hidden="true" />
              </Link>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-x-auto">
              {records.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500 gap-2">
                  <CalendarCheck size={28} weight="duotone" className="opacity-40" aria-hidden="true" />
                  <span>Tiada rekod kerja direkodkan bagi tempoh ini</span>
                </div>
              ) : (
                <table aria-label="Senarai rekod kerja dan kehadiran harian terkini" className="w-full text-left text-xs">
                  <thead>
                    <tr className={TABLE_HEAD_ROW}>
                      <th scope="col" className="hidden @lg:table-cell px-4 py-2.5">
                        Tarikh
                      </th>
                      <th scope="col" className="px-4 py-2.5">
                        Pekerja
                      </th>
                      <th scope="col" className="px-4 py-2.5 text-right">
                        Amaun
                      </th>
                      <th scope="col" className="hidden @lg:table-cell px-4 py-2.5 text-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {records.map((record, index) => {
                      const statusMeta =
                        STATUS_CONFIG[record.status as RecordStatus] || STATUS_CONFIG.UNPAID;

                      const statusBadge = (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                            statusMeta.badgeClass
                          )}
                        >
                          <span
                            className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusMeta.dotColor)}
                            aria-hidden="true"
                          />
                          {statusMeta.label}
                        </span>
                      );

                      return (
                        <tr
                          key={record.id || `rec-${index}`}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="hidden @lg:table-cell px-4 py-3 font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {formatDate(record.workDate)}
                          </td>
                          <td className="px-4 py-3 max-w-0 w-full @lg:w-auto @lg:max-w-none">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate @lg:max-w-[180px]" title={record.employeeName}>
                              {record.employeeName}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {record.employeeCode}
                              {/* Compact layout: date folds under the name */}
                              <span className="@lg:hidden">
                                <span aria-hidden="true"> · </span>
                                <span className="tabular-nums">{formatDate(record.workDate)}</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap align-top @lg:align-middle">
                            <div className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                              {formatCurrency(record.amount)}
                            </div>
                            {/* Compact layout: status folds under the amount */}
                            <div className="mt-1 @lg:hidden">{statusBadge}</div>
                          </td>
                          <td className="hidden @lg:table-cell px-4 py-3 text-right whitespace-nowrap">
                            {statusBadge}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Bayaran Gaji Terkini Table Card */}
        {(activeTab === "all" || activeTab === "payments") && (
          <div
            id="panel-recent-payments"
            role="region"
            aria-label="Bayaran Terkini"
            className="@container bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden min-w-0"
          >
            {/* Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Money size={18} weight="duotone" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Bayaran Terkini
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Transaksi pengeluaran gaji terkini
                  </p>
                </div>
              </div>

              <Link href="/payments" className={VIEW_ALL_LINK}>
                <span>Lihat semua</span>
                <ArrowRight size={13} weight="bold" aria-hidden="true" />
              </Link>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-x-auto">
              {paymentList.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500 gap-2">
                  <Money size={28} weight="duotone" className="opacity-40" aria-hidden="true" />
                  <span>Tiada rekod pembayaran gaji setakat ini</span>
                </div>
              ) : (
                <table aria-label="Senarai rekod transaksi bayaran gaji terkini" className="w-full text-left text-xs">
                  <thead>
                    <tr className={TABLE_HEAD_ROW}>
                      <th scope="col" className="hidden @xl:table-cell px-4 py-2.5">
                        Kod
                      </th>
                      <th scope="col" className="px-4 py-2.5">
                        Pekerja
                      </th>
                      <th scope="col" className="hidden @xl:table-cell px-4 py-2.5">
                        Kaedah
                      </th>
                      <th scope="col" className="px-4 py-2.5 text-right">
                        Amaun
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paymentList.map((pmt, index) => {
                      const methodChip = (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          {getPaymentMethodIcon(pmt.paymentMethod)}
                          <span>{formatPaymentMethod(pmt.paymentMethod)}</span>
                        </span>
                      );

                      return (
                        <tr
                          key={pmt.id || `pmt-${index}`}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="hidden @xl:table-cell px-4 py-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {pmt.paymentCode}
                            </span>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {formatDate(pmt.paymentDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-0 w-full @xl:w-auto @xl:max-w-none">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate @xl:max-w-[180px]" title={pmt.employeeName}>
                              {pmt.employeeName}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {pmt.employeeCode}
                              {/* Compact layout: payment code and date fold under the name */}
                              <span className="@xl:hidden">
                                <span aria-hidden="true"> · </span>
                                {pmt.paymentCode}
                                <span aria-hidden="true"> · </span>
                                <span className="tabular-nums">{formatDate(pmt.paymentDate)}</span>
                              </span>
                            </div>
                          </td>
                          <td className="hidden @xl:table-cell px-4 py-3 whitespace-nowrap">
                            {methodChip}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap align-top @xl:align-middle">
                            <div className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(pmt.amount)}
                            </div>
                            {/* Compact layout: payment method folds under the amount */}
                            <div className="mt-1 @xl:hidden">{methodChip}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentActivityTable;
