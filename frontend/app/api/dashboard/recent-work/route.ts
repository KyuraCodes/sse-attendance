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

  const { data: records, error } = await supabase
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
    .order("work_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (error) {
    return errorResponse("Failed to fetch recent work", "FETCH_FAILED", 500);
  }

  const result = (records || []).map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emp = r.employees as any;
    return {
      id: r.id,
      employeeId: r.employee_id,
      employeeCode: emp?.employee_code || "",
      employeeName: emp?.name || "",
      workDate: r.work_date,
      dailyRate: Number(r.daily_rate),
      amount: Number(r.amount),
      status: r.status,
      notes: r.notes,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  return successResponse(result, "Recent work records retrieved");
}
