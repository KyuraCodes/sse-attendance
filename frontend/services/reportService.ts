import { api } from "@/services/api";
import {
  MonthlyReport,
  OutstandingEmployeeReport,
  DailyReport,
  EmployeeReport,
  MonthlyReportQueryParams,
  DailyReportQueryParams,
  EmployeeReportQueryParams,
} from "@/types/report";

export const reportService = {
  /**
   * Fetch monthly financial summary report including gross payroll,
   * amount paid, outstanding balance, and itemized work records.
   */
  getMonthlyReport: async (
    yearOrParams?: number | MonthlyReportQueryParams,
    month?: number
  ): Promise<MonthlyReport> => {
    const params: Record<string, number> = {};

    if (typeof yearOrParams === "object" && yearOrParams !== null) {
      if (yearOrParams.year !== undefined && yearOrParams.year !== null) {
        params.year = yearOrParams.year;
      }
      if (yearOrParams.month !== undefined && yearOrParams.month !== null) {
        params.month = yearOrParams.month;
      }
    } else {
      if (yearOrParams !== undefined && yearOrParams !== null) {
        params.year = yearOrParams;
      }
      if (month !== undefined && month !== null) {
        params.month = month;
      }
    }

    const data = await api.get<MonthlyReport>("/api/reports/monthly", {
      params: Object.keys(params).length > 0 ? params : undefined,
    });

    return {
      year: data.year,
      month: data.month,
      totalWorkRecords: Number(data.totalWorkRecords || 0),
      grossPayroll: Number(data.grossPayroll || 0),
      paidAmount: Number(data.paidAmount || 0),
      outstandingAmount: Number(data.outstandingAmount || 0),
      records: Array.isArray(data.records) ? data.records : [],
    };
  },

  /**
   * Fetch daily payroll report for a specific date.
   */
  getDailyReport: async (
    dateOrParams?: string | DailyReportQueryParams
  ): Promise<DailyReport> => {
    const params: Record<string, string> = {};

    if (typeof dateOrParams === "object" && dateOrParams !== null) {
      if (dateOrParams.date) {
        params.date = dateOrParams.date;
      }
    } else if (typeof dateOrParams === "string" && dateOrParams.trim()) {
      params.date = dateOrParams.trim();
    }

    const data = await api.get<DailyReport>("/api/reports/daily", {
      params: Object.keys(params).length > 0 ? params : undefined,
    });

    return {
      date: data.date,
      totalRecords: Number(data.totalRecords || 0),
      totalAmount: Number(data.totalAmount || 0),
      records: Array.isArray(data.records) ? data.records : [],
    };
  },

  /**
   * Fetch outstanding balance report of workers with unpaid or stored salary.
   */
  getOutstandingReport: async (): Promise<OutstandingEmployeeReport[]> => {
    interface RawOutstandingItem {
      employeeId: number;
      employeeCode: string;
      employeeName: string;
      phone?: string | null;
      unpaidDays?: number;
      totalWorkDaysUnpaid?: number;
      storedDays?: number;
      storedCount?: number;
      storedAmount?: number | string;
      totalOutstanding?: number | string;
      outstandingBalance?: number | string;
    }

    const rawList = await api.get<RawOutstandingItem[]>("/api/reports/outstanding");

    if (!Array.isArray(rawList)) {
      return [];
    }

    return rawList.map((item) => {
      const unpaidDays = item.unpaidDays ?? item.totalWorkDaysUnpaid ?? 0;
      const storedDays = item.storedDays ?? item.storedCount ?? 0;
      const storedAmount = Number(item.storedAmount ?? 0);
      const totalOutstanding = Number(item.totalOutstanding ?? item.outstandingBalance ?? 0);

      return {
        employeeId: item.employeeId,
        employeeCode: item.employeeCode,
        employeeName: item.employeeName,
        phone: item.phone ?? null,
        unpaidDays,
        storedDays,
        storedAmount,
        totalOutstanding,
        outstandingBalance: totalOutstanding,
        totalWorkDaysUnpaid: unpaidDays,
        storedCount: storedDays,
      };
    });
  },

  /**
   * Fetch comprehensive report for a specific employee within an optional date range.
   */
  getEmployeeReport: async (
    employeeId: number,
    fromOrParams?: string | EmployeeReportQueryParams,
    to?: string
  ): Promise<EmployeeReport> => {
    const params: Record<string, string> = {};

    if (typeof fromOrParams === "object" && fromOrParams !== null) {
      if (fromOrParams.from) {
        params.from = fromOrParams.from;
      }
      if (fromOrParams.to) {
        params.to = fromOrParams.to;
      }
    } else {
      if (typeof fromOrParams === "string" && fromOrParams.trim()) {
        params.from = fromOrParams.trim();
      }
      if (to && to.trim()) {
        params.to = to.trim();
      }
    }

    return api.get<EmployeeReport>(`/api/reports/employee/${employeeId}`, {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
  },
};

export default reportService;
