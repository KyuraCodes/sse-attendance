"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  Money,
  Wallet,
  ArrowClockwise,
  Plus,
  CreditCard,
  WarningCircle,
} from "@phosphor-icons/react";
import { dashboardService } from "@/services/dashboardService";
import { DashboardSummary } from "@/types/dashboard";
import { MetricCard } from "@/features/dashboard/MetricCard";
import { WeeklyTrendChart } from "@/features/dashboard/WeeklyTrendChart";
import { StoredSalaryAlert } from "@/features/dashboard/StoredSalaryAlert";
import { RecentActivityTable } from "@/features/dashboard/RecentActivityTable";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDashboardData = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await dashboardService.getDashboardSummary();
      if (isMountedRef.current) {
        setSummary(data);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal memuatkan data papan pemuka. Sila periksa sambungan internet anda.";
      if (isMountedRef.current) {
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const activeEmployees = summary?.activeEmployees ?? 0;
  const workingToday = summary?.workingToday ?? 0;
  const attendanceRate =
    activeEmployees > 0
      ? Math.min(100, Math.round((workingToday / activeEmployees) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Ringkasan Operasi Eksekutif
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Metrik masa nyata operasi harian, kehadiran pekerja, dan tanggungan gaji
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={isLoading || isRefreshing}
            aria-label="Muat semula data papan pemuka"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.97] transition-all shadow-2xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 shrink-0"
            title="Muat semula data metrik"
          >
            <ArrowClockwise
              size={18}
              weight="bold"
              className={isRefreshing ? "animate-spin motion-reduce:animate-none text-emerald-600" : ""} aria-hidden="true"
            />
          </button>

          <Link href="/work-records" className="flex-1 sm:flex-initial">
            <Button variant="outline" size="sm" className="w-full min-h-[44px] sm:pointer-fine:min-h-[38px] shadow-2xs whitespace-nowrap active:scale-[0.98] transition-transform">
              <Plus size={15} weight="bold" aria-hidden="true" />
              <span className="hidden sm:inline">Rekod Kehadiran</span>
              <span className="sm:hidden">Kehadiran</span>
            </Button>
          </Link>

          <Link href="/payments" className="flex-1 sm:flex-initial">
            <Button variant="primary" size="sm" className="w-full min-h-[44px] sm:pointer-fine:min-h-[38px] shadow-2xs whitespace-nowrap active:scale-[0.98] transition-transform">
              <CreditCard size={15} weight="bold" aria-hidden="true" />
              <span className="hidden sm:inline">Bayar Gaji</span>
              <span className="sm:hidden">Bayar</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert" aria-live="assertive"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3 text-sm"
        >
          <div className="flex items-start gap-2.5">
            <WarningCircle size={20} weight="bold" className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-xs sm:text-sm">Ralat Memuatkan Papan Pemuka</p>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData()}
            className="shrink-0 text-xs border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60"
          >
            Cuba Semula
          </Button>
        </div>
      )}

      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Active Employees */}
        <MetricCard
          title="Pekerja Aktif"
          value={isLoading ? "-" : activeEmployees}
          subtitle="Jumlah tenaga kerja sedia ada"
          icon={Users}
          iconColor="text-sky-600 dark:text-sky-400"
          iconBg="bg-sky-50 dark:bg-sky-950/50"
          badge={`${activeEmployees} staf`}
          badgeVariant="slate"
          isLoading={isLoading}
        />

        {/* Metric 2: Working Today */}
        <MetricCard
          title="Bekerja Hari Ini"
          value={isLoading ? "-" : workingToday}
          subtitle="Hadir bagi syif kerja semasa"
          icon={CalendarCheck}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
          badge={isLoading ? undefined : `${attendanceRate}% hadir`}
          badgeVariant="emerald"
          isLoading={isLoading}
          isLive={true}
        />

        {/* Metric 3: Today's Payroll */}
        <MetricCard
          title="Gaji Hari Ini"
          value={isLoading ? "-" : formatCurrency(summary?.todayPayroll)}
          subtitle="Upah terakru direkodkan hari ini"
          icon={Money}
          iconColor="text-emerald-700 dark:text-emerald-400"
          iconBg="bg-emerald-50/80 dark:bg-emerald-950/50"
          isLoading={isLoading}
          isLive={true}
        />

        {/* Metric 4: Outstanding Salary */}
        <MetricCard
          title="Baki Tertunggak"
          value={isLoading ? "-" : formatCurrency(summary?.outstandingSalary)}
          subtitle="Tanggungan belum lunas & tabung"
          icon={Wallet}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950/50"
          badge={
            isLoading
              ? undefined
              : (summary?.outstandingSalary || 0) > 0
              ? "Belum Selesai"
              : "Selesai"
          }
          badgeVariant={(summary?.outstandingSalary || 0) > 0 ? "amber" : "emerald"}
          isLoading={isLoading}
        />
      </div>

      {/* 7-Day Performance & Trends */}
      <WeeklyTrendChart
        data={summary?.weeklyTrends || []}
        isLoading={isLoading}
      />

      {/* Stored Salary Notice Banner */}
      {summary?.storedSalaryAlerts && summary.storedSalaryAlerts.length > 0 && (
        <StoredSalaryAlert alerts={summary.storedSalaryAlerts} />
      )}

      {/* Recent Activity: Work Records & Payments */}
      <RecentActivityTable
        workRecords={summary?.recentWorkRecords || []}
        payments={summary?.recentPayments || []}
        isLoading={isLoading}
      />
    </div>
  );
}
