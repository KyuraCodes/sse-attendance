import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse, safeServerError } from "@/lib/apiResponse";
import { sanitizeInput } from "@/lib/security";
import { parseOtFromNotes } from "@/lib/otUtils";

export async function GET(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { searchParams } = new URL(req.url);
  const rawDate = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const date = sanitizeInput(rawDate);

  const { data: records, error } = await supabase
    .from("work_records")
    .select(`
      id,
      employee_id,
      work_date,
      daily_rate,
      amount,
      hours_worked,
      waived_amount,
      status,
      notes,
      created_by,
      created_at,
      updated_at,
      employees (
        id,
        employee_code,
        name,
        rate_type
      )
    `)
    .eq("work_date", date)
    .neq("status", "VOID")
    .order("id", { ascending: true });

  if (error) {
    return safeServerError(error, "Failed to fetch daily report", "FETCH_FAILED");
  }

  const validRecords = records || [];
  let totalAmount = 0;
  let totalOtAmount = 0;

  const recordDtos = validRecords.map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emp = r.employees as any;
    const amount = Number(r.amount);
    const otInfo = parseOtFromNotes(r.notes);
    totalAmount += amount;
    if (otInfo?.otAmount) {
      totalOtAmount += otInfo.otAmount;
    }

    return {
      id: r.id,
      employeeId: r.employee_id,
      employeeCode: emp?.employee_code || "",
      employeeName: emp?.name || "",
      workDate: r.work_date,
      dailyRate: Number(r.daily_rate),
      amount,
      hoursWorked: r.hours_worked !== null && r.hours_worked !== undefined ? Number(r.hours_worked) : undefined,
      waivedAmount: Number(r.waived_amount || 0),
      rateType: emp?.rate_type || "DAILY",
      otHours: otInfo?.otHours,
      otRate: otInfo?.otRate,
      otAmount: otInfo?.otAmount,
      status: r.status,
      notes: r.notes,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  return successResponse({
    date,
    totalRecords: validRecords.length,
    totalAmount: Number(totalAmount.toFixed(2)),
    totalOtAmount: Number(totalOtAmount.toFixed(2)),
    records: recordDtos,
  });
}
