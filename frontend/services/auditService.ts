import { api } from "@/services/api";
import { AuditLog, AuditLogQueryParams } from "@/types/audit";

export const auditService = {
  /**
   * Fetch system audit log trail for CEO review and compliance tracking.
   */
  getAuditLogs: async (params?: AuditLogQueryParams): Promise<AuditLog[]> => {
    const queryParams: Record<string, string | number> = {};

    if (params) {
      if (params.search && params.search.trim()) {
        queryParams.search = params.search.trim();
      }
      if (params.action && params.action !== "ALL") {
        queryParams.action = params.action;
      }
      if (params.entityType && params.entityType !== "ALL") {
        queryParams.entityType = params.entityType;
      }
      if (params.startDate) {
        queryParams.startDate = params.startDate;
      }
      if (params.endDate) {
        queryParams.endDate = params.endDate;
      }
      if (params.limit) {
        queryParams.limit = params.limit;
      }
      if (params.page) {
        queryParams.page = params.page;
      }
    }

    try {
      const data = await api.get<AuditLog[]>("/api/audit-logs", {
        params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn("Failed to fetch audit logs from backend:", error);
      return [];
    }
  },
};

export default auditService;
