import { api } from "@/services/api";
import {
  WorkRecord,
  CreateWorkRecordRequest,
  BulkWorkRecordRequest,
  UpdateWorkRecordStatusRequest,
  WorkRecordQueryParams,
} from "@/types/workRecord";

export const workRecordService = {
  /**
   * Fetch work records with optional filters: date (YYYY-MM-DD), employeeId, status, and month (YYYY-MM).
   * Supports both positional parameters and query object.
   */
  getWorkRecords: async (
    dateOrParams?: string | WorkRecordQueryParams,
    employeeId?: number,
    status?: string,
    month?: string
  ): Promise<WorkRecord[]> => {
    const params: Record<string, string | number> = {};

    if (typeof dateOrParams === "object" && dateOrParams !== null) {
      if (dateOrParams.date) params.date = dateOrParams.date;
      if (dateOrParams.employeeId) params.employeeId = dateOrParams.employeeId;
      if (dateOrParams.status && dateOrParams.status !== "ALL") {
        params.status = dateOrParams.status.toUpperCase();
      }
      if (dateOrParams.month) params.month = dateOrParams.month;
    } else {
      if (dateOrParams && dateOrParams.trim()) {
        params.date = dateOrParams.trim();
      }
      if (employeeId !== undefined && employeeId !== null) {
        params.employeeId = employeeId;
      }
      if (status && status !== "ALL" && status.trim()) {
        params.status = status.trim().toUpperCase();
      }
      if (month && month.trim()) {
        params.month = month.trim();
      }
    }

    return api.get<WorkRecord[]>("/api/work-records", {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
  },

  /**
   * Fetch a single work record by ID.
   */
  getWorkRecordById: async (id: number): Promise<WorkRecord> => {
    return api.get<WorkRecord>(`/api/work-records/${id}`);
  },

  /**
   * Create a single work record.
   */
  createWorkRecord: async (
    data: CreateWorkRecordRequest
  ): Promise<WorkRecord> => {
    return api.post<WorkRecord>("/api/work-records", data);
  },

  /**
   * Bulk create work records for multiple active workers on a given date.
   */
  bulkCreateWorkRecords: async (
    data: BulkWorkRecordRequest
  ): Promise<WorkRecord[]> => {
    return api.post<WorkRecord[]>("/api/work-records/bulk", data);
  },

  /**
   * Update work record status (e.g. UNPAID -> STORED, or VOID) with optional notes.
   */
  updateStatus: async (
    id: number,
    data: UpdateWorkRecordStatusRequest
  ): Promise<WorkRecord> => {
    return api.patch<WorkRecord>(`/api/work-records/${id}/status`, data);
  },
};

export default workRecordService;
