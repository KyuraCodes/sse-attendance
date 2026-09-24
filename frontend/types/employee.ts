export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export type EmployeeFilterStatus = "ALL" | "ACTIVE" | "INACTIVE";

export interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  dailyRate: number;
  startDate: string;
  status: EmployeeStatus | string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeRequest {
  name: string;
  dailyRate: number;
  startDate: string;
  phone?: string;
  address?: string;
  notes?: string;
  status?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  dailyRate?: number;
  startDate?: string;
  phone?: string;
  address?: string;
  notes?: string;
}
