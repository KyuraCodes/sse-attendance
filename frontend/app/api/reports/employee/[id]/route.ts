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
  const employeeId = Number(id);

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const { data: employee, error: empErr } = await supabase
    .from("employees")
    .select("id, employee_code, name")
    .eq("id", employeeId)
    .maybeSingle();

  if (empErr || !employee) {
    return errorResponse("Employee not found", "EMPLOYEE_NOT_FOUND", 404);
  }

  // Work records query
  let wrQuery = supabase
    .from("work_records")
    .select("id, employee_id, work_date, daily_rate, amount, status, notes, created_by, created_at, updated_at")
    .eq("employee_id", employeeId)
    .neq("status", "VOID")
    .order("work_date", { ascending: false });

  if (from && from.trim()) wrQuery = wrQuery.gte("work_date", from.trim());
  if (to && to.trim()) wrQuery = wrQuery.lte("work_date", to.trim());

  const { data: rawWorkRecords } = await wrQuery;
  const workRecords = rawWorkRecords || [];

  // Payments query
  let payQuery = supabase
    .from("payments")
    .select("id, payment_code, employee_id, payment_date, amount, payment_method, reference, notes, created_by, created_at")
    .eq("employee_id", employeeId)
    .order("payment_date", { ascending: false });

  if (from && from.trim()) payQuery = payQuery.gte("payment_date", from.trim());
  if (to && to.trim()) payQuery = payQuery.lte("payment_date", to.trim());

  const { data: rawPayments } = await payQuery;
  const payments = rawPayments || [];

  // Calculate applied payment items for employee's work records
  const wrIds = workRecords.map((r) => r.id);
  let appliedMap: Record<number, number> = {};

  if (wrIds.length > 0) {
    const { data: items } = await supabase
      .from("payment_items")
      .select("work_record_id, amount_applied")
      .in("work_record_id", wrIds);

    if (items) {
      for (const item of items) {
        appliedMap[item.work_record_id] =
          (appliedMap[item.work_record_id] || 0) + Number(item.amount_applied);
      }
    }
  }

  let grossSalary = 0;
  let totalPaid = 0;
  let storedDays = 0;
  let storedAmount = 0;

  const workRecordDtos = workRecords.map((r) => {
    const amount = Number(r.amount);
    const applied = appliedMap[r.id] || 0;
    const remaining = Math.max(0, amount - applied);

    grossSalary += amount;
    totalPaid += applied;

    if (r.status === "STORED") {
      storedDays++;
      storedAmount += remaining;
    }

    return {
      id: r.id,
      employeeId: r.employee_id,
      employeeCode: employee.employee_code,
      employeeName: employee.name,
      workDate: r.work_date,
      dailyRate: Number(r.daily_rate),
      amount,
      status: r.status,
      notes: r.notes,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  const paymentDtos = payments.map((p) => ({
    id: p.id,
    paymentCode: p.payment_code,
    employeeId: p.employee_id,
    employeeCode: employee.employee_code,
    employeeName: employee.name,
    paymentDate: p.payment_date,
    amount: Number(p.amount),
    paymentMethod: p.payment_method,
    reference: p.reference,
    notes: p.notes,
    createdBy: p.created_by,
    createdAt: p.created_at,
  }));

  const totalOutstanding = Math.max(0, grossSalary - totalPaid);

  return successResponse({
    employeeId: employee.id,
    employeeCode: employee.employee_code,
    employeeName: employee.name,
    totalWorkDays: workRecords.length,
    grossSalary,
    totalPaid,
    totalOutstanding,
    storedDays,
    storedAmount,
    workRecords: workRecordDtos,
    payments: paymentDtos,
  });
}
