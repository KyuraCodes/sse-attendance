import { RecordStatus } from "@/lib/constants";

export interface StoredSalaryAlert {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  storedCount: number;
  totalStoredAmount: number;
  totalAmount?: number;
  oldestStoredDate: string;
}

export interface DashboardWorkRecord {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  workDate: string;
  dailyRate: number;
  amount: number;
  status: RecordStatus;
  notes?: string | null;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardPayment {
  id: number;
  paymentCode: string;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "DUITNOW" | "OTHER" | string;
  reference?: string | null;
  notes?: string | null;
  createdBy?: number;
  createdAt?: string;
}

export interface DashboardSummary {
  activeEmployees: number;
  workingToday: number;
  todayPayroll: number;
  outstandingSalary: number;
  storedSalaryAlerts: StoredSalaryAlert[];
  recentWorkRecords: DashboardWorkRecord[];
  recentPayments: DashboardPayment[];
}
