import { WorkRecord } from "@/types/workRecord";
import { Payment } from "@/types/payment";

export interface MonthlyReport {
  year: number;
  month: number;
  totalWorkRecords: number;
  grossPayroll: number;
  paidAmount: number;
  outstandingAmount: number;
  records: WorkRecord[];
}

export interface OutstandingEmployeeReport {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  phone?: string | null;
  unpaidDays: number;
  storedDays: number;
  storedAmount: number;
  totalOutstanding: number;
  // Compatibility fields mapping from backend OutstandingReportDto
  outstandingBalance?: number;
  totalWorkDaysUnpaid?: number;
  storedCount?: number;
}

export interface DailyReport {
  date: string;
  totalRecords: number;
  totalAmount: number;
  records: WorkRecord[];
}

export interface EmployeeReport {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  totalWorkDays: number;
  grossSalary: number;
  totalPaid: number;
  totalOutstanding: number;
  storedDays: number;
  storedAmount: number;
  workRecords: WorkRecord[];
  payments: Payment[];
}

export interface MonthlyReportQueryParams {
  year?: number;
  month?: number;
}

export interface DailyReportQueryParams {
  date?: string;
}

export interface EmployeeReportQueryParams {
  employeeId: number;
  from?: string;
  to?: string;
}
