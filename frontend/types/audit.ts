export interface AuditLog {
  id: number;
  userId?: number | null;
  userEmail?: string | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId: number;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

export interface AuditLogQueryParams {
  search?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}
