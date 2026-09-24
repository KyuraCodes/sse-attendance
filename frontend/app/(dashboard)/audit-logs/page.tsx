"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  ClockCounterClockwise,
  ArrowClockwise,
  LockKey,
  Database,
  Lightning,
} from "@phosphor-icons/react";
import { auditService } from "@/services/auditService";
import { AuditLog } from "@/types/audit";
import { AuditLogTable } from "@/features/audit/AuditLogTable";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load audit logs from backend
  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await auditService.getAuditLogs({
        search: debouncedSearch || undefined,
        action: selectedAction !== "ALL" ? selectedAction : undefined,
        entityType: selectedEntity !== "ALL" ? selectedEntity : undefined,
      });
      setLogs(data);
    } catch (err) {
      console.error("Error loading audit logs:", err);
      setError("Unable to retrieve audit logs from backend service.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedAction, selectedEntity]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Audit Logs
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <LockKey size={12} weight="bold" />
              CEO Trail
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete executive audit history: Who, What, When, Entity, Old Value, and New Value
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={isLoading}
            leftIcon={
              <ArrowClockwise
                size={16}
                className={cn(isLoading && "animate-spin")}
              />
            }
            className="whitespace-nowrap"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Logged Events
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Database size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {logs.length}
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Events matching active filter criteria
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Audit Scope
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Lightning size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-slate-900 dark:text-slate-100">
              Full Mutation History
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Employees, attendance, wage status, payments
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Compliance Standard
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={20} weight="duotone" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">
              100% Traceable
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Immutable state diffs for audit compliance
            </p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 flex items-center justify-between text-sm">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadLogs}
            className="text-xs font-semibold underline ml-4 hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Audit Log Table */}
      <AuditLogTable
        logs={logs}
        isLoading={isLoading}
        onRefresh={loadLogs}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedAction={selectedAction}
        onActionChange={setSelectedAction}
        selectedEntity={selectedEntity}
        onEntityChange={setSelectedEntity}
      />
    </div>
  );
}
