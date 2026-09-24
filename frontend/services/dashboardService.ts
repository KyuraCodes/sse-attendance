import { api } from "@/services/api";
import {
  DashboardSummary,
  DashboardWorkRecord,
  DashboardPayment,
} from "@/types/dashboard";

export const dashboardService = {
  /**
   * Fetch comprehensive dashboard summary metrics for a given date (defaults to today).
   */
  getDashboardSummary: async (date?: string): Promise<DashboardSummary> => {
    return api.get<DashboardSummary>("/dashboard/summary", {
      params: date ? { date } : undefined,
    });
  },

  /**
   * Fetch recent work records up to the specified limit.
   */
  getRecentWorkRecords: async (limit: number = 5): Promise<DashboardWorkRecord[]> => {
    return api.get<DashboardWorkRecord[]>("/dashboard/recent-work", {
      params: { limit },
    });
  },

  /**
   * Fetch recent payments up to the specified limit.
   */
  getRecentPayments: async (limit: number = 5): Promise<DashboardPayment[]> => {
    return api.get<DashboardPayment[]>("/dashboard/recent-payments", {
      params: { limit },
    });
  },

  /**
   * Fetch current total outstanding salary balance across all employees.
   */
  getTotalOutstandingSalary: async (): Promise<number> => {
    return api.get<number>("/dashboard/outstanding");
  },
};

export default dashboardService;
