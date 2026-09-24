"use client";

import React from "react";
import {
  PencilSimple,
  UserCheck,
  UserMinus,
  Users,
  CircleNotch,
  Trash,
} from "@phosphor-icons/react";
import { Employee } from "@/types/employee";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface EmployeeTableProps {
  employees: Employee[];
  isLoading?: boolean;
  onEdit: (employee: Employee) => void;
  onToggleStatus: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  togglingId?: number | null;
  onAddClick?: () => void;
  hasFilter?: boolean;
}

export function EmployeeTable({
  employees,
  isLoading = false,
  onEdit,
  onToggleStatus,
  onDelete,
  togglingId = null,
  onAddClick,
  hasFilter = false,
}: EmployeeTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Daily Rate</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {[1, 2, 3, 4, 5].map((idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-18 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center mb-4">
          <Users size={28} weight="duotone" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {hasFilter ? "No matching employees found" : "No employees registered yet"}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          {hasFilter
            ? "Try adjusting your search criteria or switching the status filter tab."
            : "Get started by adding your first daily-rated employee to the system."}
        </p>
        {!hasFilter && onAddClick && (
          <div className="mt-5">
            <Button variant="primary" size="sm" onClick={onAddClick}>
              Add First Employee
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
              <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Code
              </th>
              <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Phone
              </th>
              <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Daily Rate
              </th>
              <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Start Date
              </th>
              <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {employees.map((employee) => {
              const isActive = employee.status?.toUpperCase() === "ACTIVE";
              const isUpdatingStatus = togglingId === employee.id;

              return (
                <tr
                  key={employee.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Code */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                      {employee.employeeCode}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight">
                          {employee.name}
                        </p>
                        {employee.notes && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs mt-0.5">
                            {employee.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {employee.phone ? (
                      <span className="font-mono text-xs">{employee.phone}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600">-</span>
                    )}
                  </td>

                  {/* Daily Rate */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(employee.dailyRate)}
                    </span>
                  </td>

                  {/* Start Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-mono text-xs">{formatDate(employee.startDate)}</span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isActive ? "bg-emerald-500" : "bg-slate-400"
                        )}
                        aria-hidden="true"
                      />
                      <span>{isActive ? "ACTIVE" : "INACTIVE"}</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(employee)}
                        aria-label={`Edit ${employee.name}`}
                        className="h-8 px-2.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      >
                        <PencilSimple size={14} weight="bold" />
                        <span>Edit</span>
                      </Button>

                      <Button
                        variant={isActive ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => onToggleStatus(employee)}
                        disabled={isUpdatingStatus}
                        isLoading={isUpdatingStatus}
                        aria-label={isActive ? `Deactivate ${employee.name}` : `Activate ${employee.name}`}
                        className={cn(
                          "h-8 px-2.5 text-xs",
                          isActive
                            ? "text-slate-600 hover:text-rose-600 hover:border-rose-300 dark:text-slate-400 dark:hover:text-rose-400"
                            : "text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/50"
                        )}
                      >
                        {!isUpdatingStatus && (
                          isActive ? (
                            <UserMinus size={14} weight="bold" />
                          ) : (
                            <UserCheck size={14} weight="bold" />
                          )
                        )}
                        <span>{isActive ? "Deactivate" : "Activate"}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(employee)}
                        aria-label={`Delete ${employee.name}`}
                        className="h-8 px-2.5 text-xs text-rose-600 dark:text-rose-400 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800"
                      >
                        <Trash size={14} weight="bold" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EmployeeTable;
