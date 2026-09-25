import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 5, 50);

  const { data: payments, error } = await supabase
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
    .order("payment_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (error) {
    return errorResponse("Failed to fetch recent payments", "FETCH_FAILED", 500);
  }

  const result = (payments || []).map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emp = p.employees as any;
    return {
      id: p.id,
      paymentCode: p.payment_code,
      employeeId: p.employee_id,
      employeeCode: emp?.employee_code || "",
      employeeName: emp?.name || "",
      paymentDate: p.payment_date,
      amount: Number(p.amount),
      paymentMethod: p.payment_method,
      reference: p.reference,
      notes: p.notes,
      createdBy: p.created_by,
      createdAt: p.created_at,
    };
  });

  return successResponse(result, "Recent payments retrieved");
}
