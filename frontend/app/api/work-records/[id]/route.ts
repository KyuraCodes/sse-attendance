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
  const recordId = Number(id);

  const { data: record, error } = await supabase
    .from("work_records")
    .select(`
      id,
      employee_id,
      work_date,
      daily_rate,
      amount,
      status,
      notes,
      created_by,
      created_at,
      updated_at,
      employees (
        id,
        employee_code,
        name
      )
    `)
    .eq("id", recordId)
    .maybeSingle();

  if (error || !record) {
    return errorResponse("Work record not found", "NOT_FOUND", 404);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emp = record.employees as any;

  return successResponse({
    id: record.id,
    employeeId: record.employee_id,
    employeeCode: emp?.employee_code || "",
    employeeName: emp?.name || "",
    workDate: record.work_date,
    dailyRate: Number(record.daily_rate),
    amount: Number(record.amount),
    status: record.status,
    notes: record.notes,
    createdBy: record.created_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  });
}
