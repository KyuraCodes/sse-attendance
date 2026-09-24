import { api } from "@/services/api";
import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from "@/types/employee";

export const employeeService = {
  /**
   * Fetch employees with optional search and status filtering.
   * If status is 'ALL' or empty, status filter parameter is omitted.
   */
  getEmployees: async (search?: string, status?: string): Promise<Employee[]> => {
    const params: Record<string, string> = {};
    if (search && search.trim()) {
      params.search = search.trim();
    }
    if (status && status !== "ALL" && status.trim()) {
      params.status = status.trim().toUpperCase();
    }

    return api.get<Employee[]>("/api/employees", {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
  },

  /**
   * Fetch a single employee by ID.
   */
  getEmployee: async (id: number): Promise<Employee> => {
    return api.get<Employee>(`/api/employees/${id}`);
  },

  /**
   * Create a new employee.
   */
  createEmployee: async (data: CreateEmployeeRequest): Promise<Employee> => {
    return api.post<Employee>("/api/employees", data);
  },

  /**
   * Update an existing employee details.
   */
  updateEmployee: async (
    id: number,
    data: UpdateEmployeeRequest
  ): Promise<Employee> => {
    return api.put<Employee>(`/api/employees/${id}`, data);
  },

  /**
   * Update employee active/inactive status.
   */
  updateEmployeeStatus: async (
    id: number,
    status: string
  ): Promise<Employee> => {
    return api.patch<Employee>(`/api/employees/${id}/status`, { status });
  },
};

export default employeeService;
