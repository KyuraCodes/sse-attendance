import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

const COMPANY_NAME = "Sepakat Silaturrahim Enterprise";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { id } = await params;
  const paymentId = Number(id);

  const { data: payment, error } = await supabase
    .from("payments")
    .select(`
      id,
      payment_code,
      employee_id,
      payment_date,
      amount,
      payment_method,
      reference,
      notes,
      settle_in_full,
      created_by,
      created_at,
      employees (
        id,
        employee_code,
        name
      )
    `)
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !payment) {
    return errorResponse("Payment not found", "NOT_FOUND", 404);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emp = payment.employees as any;

  // Fetch payment items with work record details
  const { data: items } = await supabase
    .from("payment_items")
    .select(`
      id,
      payment_id,
      work_record_id,
      amount_applied,
      created_at,
      work_records (
        id,
        work_date,
        daily_rate,
        status
      )
    `)
    .eq("payment_id", paymentId);

  const receiptItems = (items || []).map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wr = item.work_records as any;
    return {
      id: item.id,
      paymentId: item.payment_id,
      workRecordId: item.work_record_id,
      workDate: wr?.work_date || "",
      dailyRate: Number(wr?.daily_rate || 0),
      amountApplied: Number(item.amount_applied),
      workRecordStatus: wr?.status || "",
      createdAt: item.created_at,
    };
  });

  return successResponse({
    companyName: COMPANY_NAME,
    paymentId: payment.id,
    paymentCode: payment.payment_code,
    employeeId: payment.employee_id,
    employeeCode: emp?.employee_code || "",
    employeeName: emp?.name || "",
    paymentDate: payment.payment_date,
    paymentMethod: payment.payment_method,
    reference: payment.reference,
    notes: payment.notes,
    totalAmount: Number(payment.amount),
    status: "PAID",
    settleInFull: Boolean(payment.settle_in_full),
    items: receiptItems,
  });
}
