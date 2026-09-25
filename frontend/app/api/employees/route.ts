import { NextRequest } from "next/server";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { RateType } from "@/types/employee";

export async function GET(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  let query = supabase
    .from("employees")
    .select("id, employee_code, name, phone, address, daily_rate, rate_type, start_date, status, notes, created_at, updated_at")
    .order("id", { ascending: true });

  if (status && status !== "ALL") {
    query = query.eq("status", status.toUpperCase());
  }

  if (search && search.trim()) {
    const s = search.trim();
    query = query.or(`name.ilike.%${s}%,employee_code.ilike.%${s}%`);
  }

  const { data: employees, error } = await query;
  if (error) {
    console.error("Fetch employees error:", error);
    return errorResponse("Failed to fetch employees", "FETCH_FAILED", 500);
  }

  const result = (employees || []).map((e) => ({
    id: e.id,
    employeeCode: e.employee_code,
    name: e.name,
    phone: e.phone,
    address: e.address,
    dailyRate: Number(e.daily_rate),
    rateType: (e.rate_type as RateType) || "DAILY",
    startDate: e.start_date,
    status: e.status,
    notes: e.notes,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  }));

  return successResponse(result, "Employees retrieved");
}

export async function POST(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  if (currentUser.role !== "CEO" && currentUser.role !== "ADMIN") {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const { name, phone, address, dailyRate, rateType: rawRateType, startDate, status, notes } = body;

    if (!name || !name.trim()) {
      return errorResponse("Name is required", "INVALID_NAME", 400);
    }
    if (!startDate) {
      return errorResponse("Start date is required", "INVALID_START_DATE", 400);
    }
    const rate = Number(dailyRate);
    if (isNaN(rate) || rate <= 0) {
      return errorResponse("Daily rate must be greater than 0", "INVALID_DAILY_RATE", 400);
    }

    const inputRateType = rawRateType || "DAILY";
    const normalizedRateType = String(inputRateType).toUpperCase();
    const validRateTypes: RateType[] = ["HOURLY", "DAILY", "WEEKLY", "MONTHLY"];
    if (!validRateTypes.includes(normalizedRateType as RateType)) {
      return errorResponse(
        "Invalid rate type. Allowed: HOURLY, DAILY, WEEKLY, MONTHLY",
        "INVALID_RATE_TYPE",
        400
      );
    }
    const rateType = normalizedRateType as RateType;

    // Generate unique employee code
    const { count } = await supabase.from("employees").select("*", { count: "exact", head: true });
    let codeIndex = (count || 0) + 1;
    let employeeCode = `EMP-${String(codeIndex).padStart(3, "0")}`;

    while (true) {
      const { data: existing } = await supabase
        .from("employees")
        .select("id")
        .eq("employee_code", employeeCode)
        .maybeSingle();

      if (!existing) break;
      codeIndex++;
      employeeCode = `EMP-${String(codeIndex).padStart(3, "0")}`;
    }

    const { data: newEmployee, error } = await supabase
      .from("employees")
      .insert({
        employee_code: employeeCode,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        daily_rate: rate,
        rate_type: rateType,
        start_date: startDate,
        status: status ? status.trim().toUpperCase() : "ACTIVE",
        notes: notes ? notes.trim() : null,
      })
      .select("id, employee_code, name, phone, address, daily_rate, rate_type, start_date, status, notes, created_at, updated_at")
      .single();

    if (error || !newEmployee) {
      console.error("Create employee error:", error);
      return errorResponse("Failed to create employee", "INSERT_FAILED", 500);
    }

    await logAudit(
      currentUser.id,
      "CREATE",
      "EMPLOYEE",
      newEmployee.id,
      null,
      JSON.stringify({
        employeeCode: newEmployee.employee_code,
        name: newEmployee.name,
        dailyRate: newEmployee.daily_rate,
        rateType: newEmployee.rate_type,
        status: newEmployee.status,
      })
    );

    return successResponse(
      {
        id: newEmployee.id,
        employeeCode: newEmployee.employee_code,
        name: newEmployee.name,
        phone: newEmployee.phone,
        address: newEmployee.address,
        dailyRate: Number(newEmployee.daily_rate),
        rateType: (newEmployee.rate_type as RateType) || "DAILY",
        startDate: newEmployee.start_date,
        status: newEmployee.status,
        notes: newEmployee.notes,
        createdAt: newEmployee.created_at,
        updatedAt: newEmployee.updated_at,
      },
      "Employee created successfully",
      201
    );
  } catch (error) {
    console.error("Create employee exception:", error);
    return errorResponse("Failed to create employee", "INTERNAL_SERVER_ERROR", 500);
  }
}
