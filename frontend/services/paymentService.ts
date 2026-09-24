import { api } from "@/services/api";
import {
  Payment,
  CreatePaymentRequest,
  ReceiptDto,
  PaymentQueryParams,
  OutstandingReportDto,
} from "@/types/payment";

export const paymentService = {
  /**
   * Fetch payments with optional filtering by employeeId, startDate, and endDate.
   * Supports both positional parameters and query object.
   */
  getPayments: async (
    employeeIdOrParams?: number | PaymentQueryParams,
    startDate?: string,
    endDate?: string
  ): Promise<Payment[]> => {
    const params: Record<string, string | number> = {};

    if (typeof employeeIdOrParams === "object" && employeeIdOrParams !== null) {
      if (employeeIdOrParams.employeeId !== undefined && employeeIdOrParams.employeeId !== null) {
        params.employeeId = employeeIdOrParams.employeeId;
      }
      if (employeeIdOrParams.startDate && employeeIdOrParams.startDate.trim()) {
        params.startDate = employeeIdOrParams.startDate.trim();
      }
      if (employeeIdOrParams.endDate && employeeIdOrParams.endDate.trim()) {
        params.endDate = employeeIdOrParams.endDate.trim();
      }
    } else {
      if (employeeIdOrParams !== undefined && employeeIdOrParams !== null) {
        params.employeeId = employeeIdOrParams;
      }
      if (startDate && startDate.trim()) {
        params.startDate = startDate.trim();
      }
      if (endDate && endDate.trim()) {
        params.endDate = endDate.trim();
      }
    }

    return api.get<Payment[]>("/api/payments", {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
  },

  /**
   * Fetch a single payment record by ID.
   */
  getPaymentById: async (id: number): Promise<Payment> => {
    return api.get<Payment>(`/api/payments/${id}`);
  },

  /**
   * Create a new payment record with automatic FIFO settlement of unpaid work records.
   */
  createPayment: async (data: CreatePaymentRequest): Promise<Payment> => {
    return api.post<Payment>("/api/payments", data);
  },

  /**
   * Fetch the official printable receipt with settled item allocations.
   */
  getReceipt: async (paymentId: number): Promise<ReceiptDto> => {
    return api.get<ReceiptDto>(`/api/payments/${paymentId}/receipt`);
  },

  /**
   * Fetch current outstanding balance report for all employees.
   */
  getOutstandingReport: async (): Promise<OutstandingReportDto[]> => {
    return api.get<OutstandingReportDto[]>("/api/reports/outstanding");
  },
};

export default paymentService;
