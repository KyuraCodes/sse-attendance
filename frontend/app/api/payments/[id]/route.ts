import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

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

  return successResponse({
    id: payment.id,
    paymentCode: payment.payment_code,
    employeeId: payment.employee_id,
    employeeCode: emp?.employee_code || "",
    employeeName: emp?.name || "",
    paymentDate: payment.payment_date,
    amount: Number(payment.amount),
    paymentMethod: payment.payment_method,
    reference: payment.reference,
    notes: payment.notes,
    createdBy: payment.created_by,
    createdAt: payment.created_at,
  });
}
