import { RateType } from "./employee";

export type WorkRecordStatus =
  | "UNPAID"
  | "STORED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "VOID";

export type WorkRecordFilterStatus = "ALL" | WorkRecordStatus;

export interface WorkRecord {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  workDate: string; // ISO format: YYYY-MM-DD
  dailyRate: number;
  amount: number;
  status: WorkRecordStatus | string;
  hoursWorked?: number;
  waivedAmount?: number;
  rateType?: RateType;
  otHours?: number;
  otRate?: number;
  otAmount?: number;
  notes?: string | null;
  createdBy?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface WorkRecordDto extends WorkRecord {
  hoursWorked?: number;
  waivedAmount?: number;
  rateType?: RateType;
  otHours?: number;
  otRate?: number;
  otAmount?: number;
}

export interface CreateWorkRecordRequest {
  employeeId: number;
  workDate: string; // ISO format: YYYY-MM-DD
  hoursWorked?: number;
  amount?: number;
  otHours?: number;
  otRate?: number;
  otAmount?: number;
  notes?: string;
}

export interface BulkWorkRecordEntry {
  employeeId: number;
  hoursWorked?: number;
  amount?: number;
  otHours?: number;
  otRate?: number;
  otAmount?: number;
}

export interface BulkWorkRecordRequest {
  workDate: string; // ISO format: YYYY-MM-DD
  employeeIds?: number[];
  entries?: BulkWorkRecordEntry[];
  notes?: string;
}

export interface UpdateWorkRecordStatusRequest {
  status: WorkRecordStatus | string;
  notes?: string;
}

export interface WorkRecordQueryParams {
  date?: string;
  employeeId?: number;
  status?: string;
  month?: string;
}
