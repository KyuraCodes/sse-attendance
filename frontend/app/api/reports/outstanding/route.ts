import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { data: employees, error: empErr } = await supabase
    .from("employees")
    .select("id, employee_code, name, phone, status")
    .order("id", { ascending: true });

  if (empErr) {
    return errorResponse("Failed to fetch employees", "FETCH_FAILED", 500);
  }

  const { data: payableRecords, error: wrErr } = await supabase
    .from("work_records")
    .select("id, employee_id, amount, status, waived_amount")
    .in("status", ["UNPAID", "STORED", "PARTIALLY_PAID"]);

  if (wrErr) {
    return errorResponse("Failed to fetch payable records", "FETCH_FAILED", 500);
  }

  const recordIds = (payableRecords || []).map((r) => r.id);
  let appliedMap: Record<number, number> = {};

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

  // Group by employee
  const employeeRecords: Record<
    number,
    { id: number; amount: number; remaining: number; status: string }[]
  > = {};

  for (const r of payableRecords || []) {
    if (r.status === "PAID") continue;
    const applied = appliedMap[r.id] || 0;
    const waived = Number(r.waived_amount || 0);
    const remaining = Math.max(0, Number(r.amount) - applied - waived);
    if (remaining > 0.001) {
      if (!employeeRecords[r.employee_id]) {
        employeeRecords[r.employee_id] = [];
      }
      employeeRecords[r.employee_id].push({
        id: r.id,
        amount: Number(r.amount),
        remaining,
        status: r.status,
      });
    }
  }

  const reportList = (employees || []).map((emp) => {
    const records = employeeRecords[emp.id] || [];
    let outstandingBalance = 0;
    let unpaidDays = 0;
    let storedAmount = 0;
    let storedDays = 0;

    for (const r of records) {
      outstandingBalance += r.remaining;
      unpaidDays++;
      if (r.status === "STORED") {
        storedAmount += r.remaining;
        storedDays++;
      }
    }

    return {
      employeeId: emp.id,
      employeeCode: emp.employee_code,
      employeeName: emp.name,
      phone: emp.phone || null,
      unpaidDays,
      storedDays,
      storedAmount,
      totalOutstanding: outstandingBalance,
      outstandingBalance,
      totalWorkDaysUnpaid: unpaidDays,
      storedCount: storedDays,
    };
  });

  return successResponse(reportList, "Outstanding report retrieved");
}
