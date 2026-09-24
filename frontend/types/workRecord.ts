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
  notes?: string | null;
  createdBy?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateWorkRecordRequest {
  employeeId: number;
  workDate: string; // ISO format: YYYY-MM-DD
  notes?: string;
}

export interface BulkWorkRecordRequest {
  workDate: string; // ISO format: YYYY-MM-DD
  employeeIds: number[];
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
