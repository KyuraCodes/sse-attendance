"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import {
  Users,
  Plus,
  MagnifyingGlass,
  ArrowClockwise,
  WarningCircle,
  CheckCircle,
  X,
  Funnel,
} from "@phosphor-icons/react";
import { employeeService } from "@/services/employeeService";
import { Employee, EmployeeFilterStatus } from "@/types/employee";
import { EmployeeTable } from "@/features/employees/EmployeeTable";
import { AddEmployeeModal } from "@/features/employees/AddEmployeeModal";
import { EditEmployeeModal } from "@/features/employees/EditEmployeeModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployeeFilterStatus>("ALL");

  // Modals & Actions
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load employees
  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await employeeService.getEmployees(
        debouncedSearch,
        statusFilter === "ALL" ? undefined : statusFilter
      );
      setEmployees(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load employees. Please check your network connection.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Auto-dismiss toast feedback after 4 seconds
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Action handlers
  const handleAddSuccess = (newEmployee: Employee) => {
    setFeedbackMessage({
      type: "success",
      text: `Employee ${newEmployee.name} (${newEmployee.employeeCode}) was successfully registered.`,
    });
    loadEmployees();
  };

  const handleEditSuccess = (updatedEmployee: Employee) => {
    setFeedbackMessage({
      type: "success",
      text: `Employee ${updatedEmployee.name} (${updatedEmployee.employeeCode}) was successfully updated.`,
    });
    loadEmployees();
  };

  const handleToggleStatus = async (employee: Employee) => {
    const isCurrentlyActive = employee.status?.toUpperCase() === "ACTIVE";
    const nextStatus = isCurrentlyActive ? "INACTIVE" : "ACTIVE";

    setTogglingId(employee.id);
    try {
      const updated = await employeeService.updateEmployeeStatus(
        employee.id,
        nextStatus
      );
      setFeedbackMessage({
        type: "success",
        text: `Employee ${updated.name} status changed to ${nextStatus}.`,
      });
      // Optimistically update list
      setEmployees((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update employee status. Please try again.";
      setFeedbackMessage({
        type: "error",
        text: message,
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Status metrics counts
  const totalEmployees = employees.length;
  const activeCount = employees.filter(
    (e) => e.status?.toUpperCase() === "ACTIVE"
  ).length;
  const inactiveCount = employees.filter(
    (e) => e.status?.toUpperCase() === "INACTIVE"
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Employee Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Directory of daily-rated workforce, wage arrangements and active roster
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadEmployees()}
            disabled={isLoading}
            aria-label="Refresh employee list"
            title="Refresh employee directory"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            <ArrowClockwise
              size={18}
              weight="bold"
              className={isLoading ? "animate-spin text-emerald-600" : ""}
            />
          </button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            className="shadow-xs"
          >
            <Plus size={16} weight="bold" />
            <span>Add Employee</span>
          </Button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          role="status"
          className={cn(
            "p-3.5 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200",
            feedbackMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === "success" ? (
              <CheckCircle size={18} weight="bold" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <WarningCircle size={18} weight="bold" className="text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-current opacity-70 hover:opacity-100 p-1"
            aria-label="Dismiss notification"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3 text-sm"
        >
          <div className="flex items-start gap-2.5">
            <WarningCircle size={20} weight="bold" className="shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold text-xs sm:text-sm">Unable to load employees</p>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadEmployees()}
            className="shrink-0 text-xs border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          >
            <MagnifyingGlass size={16} weight="bold" />
          </span>
          <input
            type="text"
            placeholder="Search by name or code (e.g. EMP-001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search query"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer",
              statusFilter === "ALL"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
              statusFilter === "ACTIVE"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>Active</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("INACTIVE")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
              statusFilter === "INACTIVE"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />
            <span>Inactive</span>
          </button>
        </div>
      </div>

      {/* Employee Table */}
      <EmployeeTable
        employees={employees}
        isLoading={isLoading}
        onEdit={(employee) => setEditingEmployee(employee)}
        onToggleStatus={handleToggleStatus}
        togglingId={togglingId}
        onAddClick={() => setIsAddModalOpen(true)}
        hasFilter={Boolean(searchQuery.trim() || statusFilter !== "ALL")}
      />

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        employee={editingEmployee}
        isOpen={Boolean(editingEmployee)}
        onClose={() => setEditingEmployee(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
