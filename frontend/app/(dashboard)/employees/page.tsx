"use client";

import React, { useState, useEffect, useCallback, useRef, useTransition } from "react";
import {
  Users,
  Plus,
  MagnifyingGlass,
  ArrowClockwise,
  WarningCircle,
  CheckCircle,
  X,
  Funnel,
  Trash,
} from "@phosphor-icons/react";
import { employeeService } from "@/services/employeeService";
import { Employee, EmployeeFilterStatus } from "@/types/employee";
import { EmployeeTable } from "@/features/employees/EmployeeTable";
import { AddEmployeeModal } from "@/features/employees/AddEmployeeModal";
import { EditEmployeeModal } from "@/features/employees/EditEmployeeModal";
import { Button } from "@/components/ui/Button";
import { cn, formatCurrency } from "@/lib/utils";

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
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      if (isMountedRef.current) {
        setEmployees(data);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message =
          err instanceof Error
            ? err.message
            : "Gagal memuatkan senarai pekerja. Sila semak sambungan internet anda.";
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
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
      text: `Pekerja ${newEmployee.name} (${newEmployee.employeeCode}) berjaya didaftarkan.`,
    });
    loadEmployees();
  };

  const handleEditSuccess = (updatedEmployee: Employee) => {
    setFeedbackMessage({
      type: "success",
      text: `Maklumat pekerja ${updatedEmployee.name} (${updatedEmployee.employeeCode}) berjaya dikemas kini.`,
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
      if (isMountedRef.current) {
        setFeedbackMessage({
          type: "success",
          text: `Status pekerja ${updated.name} ditukar kepada ${nextStatus === "ACTIVE" ? "AKTIF" : "TIDAK AKTIF"}.`,
        });
        // Optimistically update list
        setEmployees((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message =
          err instanceof Error
            ? err.message
            : "Gagal mengemas kini status pekerja. Sila cuba sebentar lagi.";
        setFeedbackMessage({
          type: "error",
          text: message,
        });
      }
    } finally {
      if (isMountedRef.current) {
        setTogglingId(null);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return;

    setIsDeleting(true);
    try {
      await employeeService.deleteEmployee(deletingEmployee.id);
      if (isMountedRef.current) {
        setFeedbackMessage({
          type: "success",
          text: `Pekerja ${deletingEmployee.name} (${deletingEmployee.employeeCode}) berjaya dipadam.`,
        });
        setDeletingEmployee(null);
        loadEmployees();
      }
    } catch (err) {
      if (isMountedRef.current) {
        const message =
          err instanceof Error
            ? err.message
            : "Gagal memadam rekod pekerja. Sila cuba sebentar lagi.";
        setFeedbackMessage({
          type: "error",
          text: message,
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsDeleting(false);
      }
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
              Pengurusan Pekerja
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Direktori tenaga kerja, penetapan kadar upah, dan senarai bertugas aktif
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => loadEmployees()}
            disabled={isLoading}
            aria-label="Muat semula senarai pekerja"
            title="Muat semula senarai pekerja"
            className="p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 shrink-0"
          >
            <ArrowClockwise
              size={18}
              weight="bold"
              className={isLoading ? "animate-spin text-emerald-600 motion-reduce:animate-none" : ""}
            />
          </button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            className="shadow-xs flex-1 sm:flex-initial justify-center min-h-[44px]"
          >
            <Plus size={16} weight="bold" />
            <span>Tambah Pekerja</span>
          </Button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          role="status"
          className={cn(
            "p-3.5 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200 motion-reduce:animate-none",
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
            aria-label="Tutup pemberitahuan"
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
              <p className="font-semibold text-xs sm:text-sm">Ralat Memuatkan Senarai Pekerja</p>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadEmployees()}
            className="shrink-0 text-xs border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60"
          >
            Cuba Semula
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full md:max-w-md">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          >
            <MagnifyingGlass size={16} weight="bold" />
          </span>
          <input
            type="text"
            placeholder="Cari nama atau kod pekerja (cth. EMP-001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Kosongkan carian"
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div
          role="tablist"
          aria-label="Penapis status pekerja"
          className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "ALL"}
            tabIndex={statusFilter === "ALL" ? 0 : -1}
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-[36px] text-xs font-semibold rounded-md transition-all flex items-center justify-center whitespace-nowrap cursor-pointer",
              statusFilter === "ALL"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            Semua
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "ACTIVE"}
            tabIndex={statusFilter === "ACTIVE" ? 0 : -1}
            onClick={() => setStatusFilter("ACTIVE")}
            className={cn(
              "px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-[36px] text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer",
              statusFilter === "ACTIVE"
                ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
            <span>Aktif</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "INACTIVE"}
            tabIndex={statusFilter === "INACTIVE" ? 0 : -1}
            onClick={() => setStatusFilter("INACTIVE")}
            className={cn(
              "px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-[36px] text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer",
              statusFilter === "INACTIVE"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
            <span>Tidak Aktif</span>
          </button>
        </div>
      </div>

      {/* Employee Table */}
      <EmployeeTable
        employees={employees}
        isLoading={isLoading}
        onEdit={(employee) => setEditingEmployee(employee)}
        onToggleStatus={handleToggleStatus}
        onDelete={(employee) => setDeletingEmployee(employee)}
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

      {/* Delete Confirmation Modal */}
      {deletingEmployee && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-employee-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 motion-reduce:animate-none"
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4 sm:space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash size={22} weight="duotone" className="sm:hidden" />
                <Trash size={24} weight="duotone" className="hidden sm:block" />
              </div>
              <div className="flex-1">
                <h3
                  id="delete-employee-title"
                  className="text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  Padam Pekerja
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Adakah anda pasti ingin memadam pekerja ini dari sistem?
                </p>
              </div>
            </div>

            {/* Target Employee Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Nama Pekerja:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {deletingEmployee.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Kod Pekerja:</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {deletingEmployee.employeeCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Kadar Upah:</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {formatCurrency(deletingEmployee.dailyRate)}
                </span>
              </div>
            </div>

            {/* Warning Message */}
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <WarningCircle size={16} weight="fill" className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>
                Tindakan ini akan memadam rekod pekerja beserta semua rekod kehadiran dan sejarah pembayaran berkaitan secara kekal. Tindakan ini tidak boleh diundur.
              </span>
            </div>

            {/* Dialog Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setDeletingEmployee(null)}
                disabled={isDeleting}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
                leftIcon={<Trash size={16} weight="bold" />}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Padam Pekerja
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
