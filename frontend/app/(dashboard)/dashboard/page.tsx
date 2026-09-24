"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { StoredSalaryAlert } from "@/features/dashboard/StoredSalaryAlert";
import { RecentActivityTable } from "@/features/dashboard/RecentActivityTable";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await dashboardService.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data. Please check your network connection.";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Executive Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time daily operations, attendance metrics and payroll liabilities
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={isLoading || isRefreshing}
            aria-label="Refresh dashboard data"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            title="Refresh metrics"
          >
            <ArrowClockwise
              size={18}
              weight="bold"
              className={isRefreshing ? "animate-spin text-emerald-600" : ""}
            />
          </button>

          <Link href="/work-records">
            <Button variant="outline" size="sm" className="shadow-2xs">
              <Plus size={15} weight="bold" />
              <span>Record Attendance</span>
            </Button>
          </Link>

          <Link href="/payments">
            <Button variant="primary" size="sm" className="shadow-2xs">
              <CreditCard size={15} weight="bold" />
              <span>Disburse Salary</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3 text-sm"
        >
          <div className="flex items-start gap-2.5">
            <WarningCircle size={20} weight="bold" className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-xs sm:text-sm">Error Loading Dashboard</p>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData()}
            className="shrink-0 text-xs border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Employees */}
        <MetricCard
          title="Active Employees"
          value={isLoading ? "-" : activeEmployees}
          subtitle="Total workforce available"
          icon={Users}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-950/50"
          badge={`${activeEmployees} staff`}
          badgeVariant="slate"
          isLoading={isLoading}
        />

        {/* Metric 2: Working Today */}
        <MetricCard
          title="Working Today"
          value={isLoading ? "-" : workingToday}
          subtitle="Present for current shift"
          icon={CalendarCheck}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-950/50"
          badge={isLoading ? undefined : `${attendanceRate}%`}
          badgeVariant="emerald"
          isLoading={isLoading}
        />

        {/* Metric 3: Today's Payroll */}
        <MetricCard
          title="Today's Payroll"
          value={isLoading ? "-" : formatCurrency(summary?.todayPayroll)}
          subtitle="Earned wages logged today"
          icon={Money}
          iconColor="text-indigo-600 dark:text-indigo-400"
          iconBg="bg-indigo-50 dark:bg-indigo-950/50"
          isLoading={isLoading}
        />

        {/* Metric 4: Outstanding Salary */}
        <MetricCard
          title="Outstanding Salary"
          value={isLoading ? "-" : formatCurrency(summary?.outstandingSalary)}
          subtitle="Unpaid and stored liability"
          icon={Wallet}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-950/50"
          badge={
            isLoading
              ? undefined
              : (summary?.outstandingSalary || 0) > 0
              ? "Pending"
              : "Settled"
          }
          badgeVariant={(summary?.outstandingSalary || 0) > 0 ? "amber" : "emerald"}
          isLoading={isLoading}
        />
      </div>

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
