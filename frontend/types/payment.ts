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
  settleInFull?: boolean;
  createdBy?: number;
  createdAt?: string;
  items?: PaymentItem[];
}

export interface PaymentDto extends Payment {
  settleInFull?: boolean;
}

export interface CreatePaymentRequest {
  employeeId: number;
  paymentDate?: string;
  amount: number;
  paymentMethod?: PaymentMethod | string;
  reference?: string;
  notes?: string;
  settleInFull?: boolean;
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
  settleInFull?: boolean;
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
