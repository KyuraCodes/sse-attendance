"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  MagnifyingGlass,
  ArrowClockwise,
  Clock,
  User,
  ArrowsLeftRight,
  Eye,
  X,
  FileCode,
  Tag,
  Funnel,
} from "@phosphor-icons/react";
import { AuditLog } from "@/types/audit";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
  onRefresh?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedAction: string;
  onActionChange: (action: string) => void;
  selectedEntity: string;
  onEntityChange: (entity: string) => void;
}

const ACTION_OPTIONS = [
  { value: "ALL", label: "All Actions" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "UPDATE_STATUS", label: "Status Change" },
  { value: "DELETE", label: "Delete" },
  { value: "VOID", label: "Void" },
];

const ENTITY_OPTIONS = [
  { value: "ALL", label: "All Entities" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "WORK_RECORD", label: "Work Record" },
  { value: "PAYMENT", label: "Payment" },
  { value: "USER", label: "User" },
];

function formatAuditTimestamp(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return dateStr;
  }
}

function renderActionBadge(action: string) {
  const norm = action?.toUpperCase() || "";
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  if (norm.includes("CREATE")) {
    badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
  } else if (norm.includes("UPDATE") || norm.includes("STATUS")) {
    badgeStyle = "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800";
  } else if (norm.includes("VOID") || norm.includes("DELETE")) {
    badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";
  }

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide", badgeStyle)}>
      {action}
    </span>
  );
}

function renderEntityBadge(entityType: string, entityId: number) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
      <Tag size={12} className="text-slate-400" />
      <span>{entityType}</span>
      <span className="text-slate-400">#{entityId}</span>
    </span>
  );
}

function formatJsonValue(val: string | null | undefined): string {
  if (!val) return "-";
  try {
    const parsed = JSON.parse(val);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return val;
  }
}

export function AuditLogTable({
  logs,
  isLoading = false,
  onRefresh,
  searchQuery,
  onSearchChange,
  selectedAction,
  onActionChange,
  selectedEntity,
  onEntityChange,
}: AuditLogTableProps) {
  const [detailModalLog, setDetailModalLog] = useState<AuditLog | null>(null);

  return (
    <div className="space-y-6">
      {/* Controls Bar: Filters & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MagnifyingGlass size={16} />
              </div>
              <input
                type="text"
                placeholder="Search audit trail by entity, action, values..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Group on mobile: 2 cols */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
              {/* Action Filter */}
              <div className="flex flex-col xs:flex-row xs:items-center gap-1 sm:gap-1.5">
                <span className="text-2xs sm:text-xs text-slate-500 font-medium whitespace-nowrap">
                  Action:
                </span>
                <select
                  aria-label="Filter by Action"
                  value={selectedAction}
                  onChange={(e) => onActionChange(e.target.value)}
                  className="w-full text-xs font-semibold py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {ACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity Filter */}
              <div className="flex flex-col xs:flex-row xs:items-center gap-1 sm:gap-1.5">
                <span className="text-2xs sm:text-xs text-slate-500 font-medium whitespace-nowrap">
                  Entity:
                </span>
                <select
                  aria-label="Filter by Entity"
                  value={selectedEntity}
                  onChange={(e) => onEntityChange(e.target.value)}
                  className="w-full text-xs font-semibold py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {ENTITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                leftIcon={
                  <ArrowClockwise
                    size={16}
                    className={cn(isLoading && "animate-spin")}
                  />
                }
                className="w-full sm:w-auto justify-center whitespace-nowrap"
              >
                Refresh Logs
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs min-w-0">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                CEO System Audit Trail
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Immutable chronological log of all database mutations and financial actions
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 py-1 px-2.5 rounded-full w-fit">
            {logs.length} logged events
          </span>
        </div>

        {isLoading ? (
          <div className="p-4 sm:p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="h-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <ShieldCheck size={26} weight="duotone" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No audit records found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedAction !== "ALL" || selectedEntity !== "ALL"
                ? "Try clearing or broadening your search filters to find specific audit events."
                : "System mutations such as employee creation, wage adjustments, and payments will be logged here automatically."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (block md:hidden) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <div key={log.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                      <Clock size={13} className="text-slate-400 shrink-0" />
                      <span>{formatAuditTimestamp(log.createdAt)}</span>
                    </div>
                    <div>
                      {renderActionBadge(log.action)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      <User size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{log.userEmail || log.userName || (log.userId ? `User #${log.userId}` : "System")}</span>
                    </div>
                    <div>
                      {renderEntityBadge(log.entityType, log.entityId)}
                    </div>
                  </div>

                  {(log.oldValue || log.newValue) && (
                    <div className="text-[11px] font-mono bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      {log.oldValue && (
                        <div className="text-slate-500 dark:text-slate-400 truncate">
                          <span className="font-semibold text-slate-400">Old: </span>{log.oldValue}
                        </div>
                      )}
                      {log.newValue && (
                        <div className="text-slate-700 dark:text-slate-300 font-medium truncate">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">New: </span>{log.newValue}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setDetailModalLog(log)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer w-full"
                    >
                      <Eye size={14} />
                      <span>View Transaction Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto min-w-0">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                    <th className="py-3 px-4 font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      When
                    </th>
                    <th className="py-3 px-4 font-semibold text-slate-500 uppercase tracking-wider">
                      Who
                    </th>
                    <th className="py-3 px-4 font-semibold text-slate-500 uppercase tracking-wider">
                      What (Action)
                    </th>
                    <th className="py-3 px-4 font-semibold text-slate-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="py-3 px-4 font-semibold text-slate-500 uppercase tracking-wider max-w-xs">
                      Old Value
                    </th>
                    <th className="py-3 px-4 font-semibold text-slate-500 uppercase tracking-wider max-w-xs">
                      New Value
                    </th>
                    <th className="py-3 px-4 font-semibold text-slate-500 uppercase tracking-wider text-right">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {logs.map((log) => {
                    const hasOldValue = Boolean(log.oldValue && log.oldValue.trim());
                    const hasNewValue = Boolean(log.newValue && log.newValue.trim());

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-slate-400" />
                            <span>{formatAuditTimestamp(log.createdAt)}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <User size={14} className="text-slate-400" />
                            <span>
                              {log.userEmail ||
                                log.userName ||
                                (log.userId ? `User #${log.userId}` : "System")}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderActionBadge(log.action)}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {renderEntityBadge(log.entityType, log.entityId)}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                          {hasOldValue ? log.oldValue : "-"}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300 font-medium max-w-[200px] truncate">
                          {hasNewValue ? log.newValue : "-"}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDetailModalLog(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Audit Detail Modal */}
      {detailModalLog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[92dvh]">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode size={20} className="text-blue-600 shrink-0" />
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Audit Transaction #{detailModalLog.id}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Timestamp</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">
                    {formatAuditTimestamp(detailModalLog.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">User</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                    {detailModalLog.userEmail || `User #${detailModalLog.userId || "System"}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Action</span>
                  <span className="mt-0.5 block">
                    {renderActionBadge(detailModalLog.action)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Entity</span>
                  <span className="mt-0.5 block">
                    {renderEntityBadge(detailModalLog.entityType, detailModalLog.entityId)}
                  </span>
                </div>
              </div>

              {/* Old Value vs New Value Diff View */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Old Value */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Old Value (Previous State)</span>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap break-all min-h-[120px]">
                    {formatJsonValue(detailModalLog.oldValue)}
                  </pre>
                </div>

                {/* New Value */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>New Value (Updated State)</span>
                  </div>
                  <pre className="p-3 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800 font-mono text-xs text-emerald-900 dark:text-emerald-200 overflow-x-auto whitespace-pre-wrap break-all min-h-[120px]">
                    {formatJsonValue(detailModalLog.newValue)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailModalLog(null)}
                className="w-full sm:w-auto justify-center whitespace-nowrap"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
