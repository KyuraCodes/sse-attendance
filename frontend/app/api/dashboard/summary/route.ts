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
  const today = searchParams.get("date") || new Date().toISOString().split("T")[0];

  // 1. Active employees count
  const { count: activeCount } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");

  // 2. Working today & payroll
  const { data: todayRecords } = await supabase
    .from("work_records")
    .select("amount")
    .eq("work_date", today)
    .neq("status", "VOID");

  const workingToday = (todayRecords || []).length;
  const todayPayroll = (todayRecords || []).reduce(
    (sum, r) => sum + Number(r.amount),
    0
  );

  // 3. Outstanding salary & Stored salary alerts
  const { data: payableRecords } = await supabase
    .from("work_records")
    .select(`
      id,
      employee_id,
      work_date,
      amount,
      status,
      employees (
        id,
        employee_code,
        name
      )
    `)
    .in("status", ["UNPAID", "STORED", "PARTIALLY_PAID"])
    .order("work_date", { ascending: true });

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

  let outstandingSalary = 0;
  const storedByEmployee: Record<
    number,
    {
      employeeId: number;
      employeeCode: string;
      employeeName: string;
      storedCount: number;
      totalStoredAmount: number;
      oldestStoredDate: string;
    }
  > = {};

  for (const r of payableRecords || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emp = r.employees as any;
    const applied = appliedMap[r.id] || 0;
    const remaining = Number(r.amount) - applied;

    if (remaining > 0.001) {
      outstandingSalary += remaining;

      if (r.status === "STORED") {
        if (!storedByEmployee[r.employee_id]) {
          storedByEmployee[r.employee_id] = {
            employeeId: r.employee_id,
            employeeCode: emp?.employee_code || "",
            employeeName: emp?.name || "",
            storedCount: 0,
            totalStoredAmount: 0,
            oldestStoredDate: r.work_date,
          };
        }
        storedByEmployee[r.employee_id].storedCount++;
        storedByEmployee[r.employee_id].totalStoredAmount += remaining;
      }
    }
  }

  const storedSalaryAlerts = Object.values(storedByEmployee);

  // 4. Recent work records (latest 5)
  const { data: recentWork } = await supabase
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
    .limit(5);

  const recentWorkRecords = (recentWork || []).map((r) => {
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

  // 5. Recent payments (latest 5)
  const { data: recentPay } = await supabase
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
    .limit(5);

  const recentPayments = (recentPay || []).map((p) => {
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

  return successResponse({
    activeEmployees: activeCount || 0,
    workingToday,
    todayPayroll,
    outstandingSalary,
    storedSalaryAlerts,
    recentWorkRecords,
    recentPayments,
  });
}
