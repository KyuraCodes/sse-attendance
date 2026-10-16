import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse, safeServerError } from "@/lib/apiResponse";
import { parseOtFromNotes } from "@/lib/otUtils";

export async function GET(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;

  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    return errorResponse("Invalid month or year", "INVALID_MONTH", 400);
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

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
    .gte("work_date", startDate)
    .lte("work_date", endDate)
    .neq("status", "VOID")
    .order("work_date", { ascending: true });

  if (error) {
    return safeServerError(error, "Failed to fetch monthly report", "FETCH_FAILED");
  }

  const validRecords = records || [];
  const recordIds = validRecords.map((r) => r.id);

  const appliedMap: Record<number, number> = {};
  if (recordIds.length > 0) {
    const { data: items } = await supabase
      .from("payment_items")
      .select("work_record_id, amount_applied")
      .in("work_record_id", recordIds);

    if (items) {
      for (const item of items) {
        appliedMap[item.work_record_id] =
          (appliedMap[item.work_record_id] || 0) + Number(item.amount_applied);
      }
    }
  }

  let grossPayroll = 0;
  let paidAmount = 0;
  let totalWaived = 0;
  let totalOtAmount = 0;

  const recordDtos = validRecords.map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emp = r.employees as any;
    const amount = Number(r.amount);
    const applied = appliedMap[r.id] || 0;
    const waived = Number(r.waived_amount || 0);
    const otInfo = parseOtFromNotes(r.notes);

    grossPayroll += amount;
    paidAmount += applied;
    totalWaived += waived;
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
      waivedAmount: waived,
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

  const outstandingAmount = Math.max(0, Number((grossPayroll - paidAmount - totalWaived).toFixed(2)));

  return successResponse({
    year,
    month,
    totalWorkRecords: validRecords.length,
    grossPayroll: Number(grossPayroll.toFixed(2)),
    paidAmount: Number(paidAmount.toFixed(2)),
    outstandingAmount,
    totalOtAmount: Number(totalOtAmount.toFixed(2)),
    records: recordDtos,
  });
}
