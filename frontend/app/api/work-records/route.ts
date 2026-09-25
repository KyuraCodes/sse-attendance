import { NextRequest } from "next/server";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const employeeId = searchParams.get("employeeId");
  const status = searchParams.get("status");
  const month = searchParams.get("month");

  let query = supabase
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
    .order("work_date", { ascending: false })
    .order("id", { ascending: false });

  if (date && date.trim()) {
    query = query.eq("work_date", date.trim());
  }

  if (employeeId) {
    query = query.eq("employee_id", Number(employeeId));
  }

  if (status && status !== "ALL" && status.trim()) {
    query = query.eq("status", status.trim().toUpperCase());
  }

  if (month && month.trim()) {
    const [y, m] = month.trim().split("-");
    if (y && m) {
      const year = Number(y);
      const mon = Number(m);
      const start = `${year}-${String(mon).padStart(2, "0")}-01`;
      const lastDay = new Date(year, mon, 0).getDate();
      const end = `${year}-${String(mon).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      query = query.gte("work_date", start).lte("work_date", end);
    }
  }

  const { data: records, error } = await query;
  if (error) {
    console.error("Fetch work records error:", error);
    return errorResponse("Failed to fetch work records", "FETCH_FAILED", 500);
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
      hoursWorked: r.hours_worked !== null && r.hours_worked !== undefined ? Number(r.hours_worked) : undefined,
      waivedAmount: Number(r.waived_amount || 0),
      rateType: emp?.rate_type || "DAILY",
      status: r.status,
      notes: r.notes,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  return successResponse(result, "Work records retrieved");
}

export async function POST(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  try {
    const body = await req.json();
    const { employeeId, workDate, hoursWorked, amount, notes } = body;

    if (!employeeId) {
      return errorResponse("Employee ID is required", "INVALID_EMPLOYEE_ID", 400);
    }
    if (!workDate) {
      return errorResponse("Work date is required", "INVALID_WORK_DATE", 400);
    }

    const { data: employee, error: empErr } = await supabase
      .from("employees")
      .select("id, employee_code, name, daily_rate, status, rate_type")
      .eq("id", Number(employeeId))
      .maybeSingle();

    if (empErr || !employee) {
      return errorResponse("Employee not found", "EMPLOYEE_NOT_FOUND", 404);
    }

    if (employee.status === "INACTIVE") {
      return errorResponse("Inactive employee cannot be assigned work records", "EMPLOYEE_INACTIVE", 400);
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from("work_records")
      .select("id")
      .eq("employee_id", employee.id)
      .eq("work_date", workDate)
      .maybeSingle();

    if (existing) {
      return errorResponse("Work record already exists for this employee on this date", "DUPLICATE_WORK_RECORD", 400);
    }

    const rateType = employee.rate_type || "DAILY";
    let finalAmount: number;

    if (rateType === "HOURLY") {
      if (hoursWorked === undefined || hoursWorked === null || isNaN(Number(hoursWorked)) || Number(hoursWorked) <= 0) {
        return errorResponse("Hours worked must be greater than 0 for hourly employees", "INVALID_HOURS_WORKED", 400);
      }
      const calculatedAmount = Number((Number(hoursWorked) * Number(employee.daily_rate)).toFixed(2));
      finalAmount = amount !== undefined && !isNaN(Number(amount)) ? Number(amount) : calculatedAmount;
    } else if (rateType === "WEEKLY") {
      const calculatedAmount = Number((Number(employee.daily_rate) / 6).toFixed(2));
      finalAmount = amount !== undefined && !isNaN(Number(amount)) ? Number(amount) : calculatedAmount;
    } else if (rateType === "MONTHLY") {
      const calculatedAmount = Number((Number(employee.daily_rate) / 26).toFixed(2));
      finalAmount = amount !== undefined && !isNaN(Number(amount)) ? Number(amount) : calculatedAmount;
    } else {
      // DAILY (default)
      finalAmount = amount !== undefined && !isNaN(Number(amount)) ? Number(amount) : Number(employee.daily_rate);
    }

    const { data: newRecord, error: insertErr } = await supabase
      .from("work_records")
      .insert({
        employee_id: employee.id,
        work_date: workDate,
        daily_rate: Number(employee.daily_rate),
        amount: finalAmount,
        hours_worked: hoursWorked ? Number(hoursWorked) : null,
        status: "UNPAID",
        waived_amount: 0.0,
        notes: notes ? notes.trim() : null,
        created_by: currentUser.id,
      })
      .select("id, employee_id, work_date, daily_rate, amount, hours_worked, waived_amount, status, notes, created_by, created_at, updated_at")
      .single();

    if (insertErr || !newRecord) {
      console.error("Create work record error:", insertErr);
      return errorResponse("Failed to create work record", "INSERT_FAILED", 500);
    }

    await logAudit(
      currentUser.id,
      "CREATE",
      "WORK_RECORD",
      newRecord.id,
      null,
      JSON.stringify({
        employeeId: employee.id,
        workDate: newRecord.work_date,
        dailyRate: newRecord.daily_rate,
        amount: newRecord.amount,
        hoursWorked: newRecord.hours_worked,
        status: newRecord.status,
      })
    );

    return successResponse(
      {
        id: newRecord.id,
        employeeId: newRecord.employee_id,
        employeeCode: employee.employee_code,
        employeeName: employee.name,
        workDate: newRecord.work_date,
        dailyRate: Number(newRecord.daily_rate),
        amount: Number(newRecord.amount),
        hoursWorked: newRecord.hours_worked !== null && newRecord.hours_worked !== undefined ? Number(newRecord.hours_worked) : undefined,
        waivedAmount: Number(newRecord.waived_amount || 0),
        rateType: employee.rate_type || "DAILY",
        status: newRecord.status,
        notes: newRecord.notes,
        createdBy: newRecord.created_by,
        createdAt: newRecord.created_at,
        updatedAt: newRecord.updated_at,
      },
      "Work record created successfully",
      201
    );
  } catch (error) {
    console.error("Create work record exception:", error);
    return errorResponse("Failed to create work record", "INTERNAL_SERVER_ERROR", 500);
  }
}
