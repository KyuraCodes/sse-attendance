export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export type EmployeeFilterStatus = "ALL" | "ACTIVE" | "INACTIVE";

export type RateType = "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  HOURLY: "Per Jam",
  DAILY: "Harian",
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
};

export const RATE_UNIT_LABELS: Record<RateType, string> = {
  HOURLY: "jam",
  DAILY: "hari",
  WEEKLY: "minggu",
  MONTHLY: "bulan",
};

export interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  dailyRate: number;
  rateType: RateType;
  startDate: string;
  status: EmployeeStatus | string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeDto extends Employee {}

export interface CreateEmployeeRequest {
  name: string;
  dailyRate: number;
  rateType?: RateType;
  startDate: string;
  phone?: string;
  address?: string;
  notes?: string;
  status?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  dailyRate?: number;
  rateType?: RateType;
  startDate?: string;
  phone?: string;
  address?: string;
  notes?: string;
}
