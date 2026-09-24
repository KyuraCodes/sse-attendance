export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "DUITNOW" | "OTHER";

export interface PaymentItem {
  id: number;
  paymentId?: number;
  workRecordId: number;
  workDate: string;
  dailyRate: number;
  amountApplied: number;
  workRecordStatus?: string;
  createdAt?: string;
}

export interface Payment {
  id: number;
  paymentCode: string;
  employeeId: number;
  employeeCode?: string;
  employeeName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod | string;
  reference?: string | null;
  notes?: string | null;
  createdBy?: number;
  createdAt?: string;
  items?: PaymentItem[];
}

export interface CreatePaymentRequest {
  employeeId: number;
  paymentDate?: string;
  amount: number;
  paymentMethod?: PaymentMethod | string;
  reference?: string;
  notes?: string;
}

export interface ReceiptDto {
  companyName: string;
  paymentId?: number;
  paymentCode: string;
  employeeId?: number;
  employeeCode: string;
  employeeName: string;
  paymentDate: string;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
  totalAmount: number;
  status?: string;
  items: PaymentItem[];
}

export interface PaymentQueryParams {
  employeeId?: number;
  startDate?: string;
  endDate?: string;
}

export interface OutstandingReportDto {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  outstandingBalance: number;
  totalWorkDaysUnpaid?: number;
  storedAmount?: number;
  storedCount?: number;
}
