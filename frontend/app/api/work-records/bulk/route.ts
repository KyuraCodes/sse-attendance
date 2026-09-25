import { NextRequest } from "next/server";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function POST(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  try {
    const body = await req.json();
    const { workDate, employeeIds, notes } = body;

    if (!workDate) {
      return errorResponse("Work date is required", "INVALID_WORK_DATE", 400);
    }
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return errorResponse("Employee IDs list cannot be empty", "INVALID_EMPLOYEE_LIST", 400);
    }

    const uniqueIds = Array.from(new Set(employeeIds.map(Number)));
    if (uniqueIds.length !== employeeIds.length) {
      return errorResponse("Duplicate employee IDs in request", "DUPLICATE_EMPLOYEE_IN_REQUEST", 400);
    }

    const { data: employees, error: empErr } = await supabase
      .from("employees")
      .select("id, employee_code, name, daily_rate, status")
      .in("id", uniqueIds);

    if (empErr || !employees || employees.length !== uniqueIds.length) {
      return errorResponse("One or more employees not found", "EMPLOYEE_NOT_FOUND", 404);
    }

    const inactive = employees.find((e) => e.status === "INACTIVE");
    if (inactive) {
      return errorResponse(`Inactive employee cannot be assigned work records: ${inactive.name}`, "EMPLOYEE_INACTIVE", 400);
    }

    // Check existing work records for that date
    const { data: existingRecords } = await supabase
      .from("work_records")
      .select("employee_id")
      .eq("work_date", workDate)
      .in("employee_id", uniqueIds);

    if (existingRecords && existingRecords.length > 0) {
      const conflictId = existingRecords[0].employee_id;
      const empConflict = employees.find((e) => e.id === conflictId);
      return errorResponse(
        `Work record already exists for ${empConflict?.name || "employee"} on ${workDate}`,
        "WORK_RECORD_ALREADY_EXISTS",
        400
      );
    }

    const newRecordsToInsert = employees.map((emp) => ({
      employee_id: emp.id,
      work_date: workDate,
      daily_rate: Number(emp.daily_rate),
      amount: Number(emp.daily_rate),
      status: "UNPAID",
      notes: notes ? notes.trim() : null,
      created_by: currentUser.id,
    }));

    const { data: insertedRecords, error: insertErr } = await supabase
      .from("work_records")
      .insert(newRecordsToInsert)
      .select("id, employee_id, work_date, daily_rate, amount, status, notes, created_by, created_at, updated_at");

    if (insertErr || !insertedRecords) {
      console.error("Bulk work records error:", insertErr);
      return errorResponse("Failed to create bulk work records", "INSERT_FAILED", 500);
    }

    const empMap = new Map(employees.map((e) => [e.id, e]));
    const result = insertedRecords.map((r) => {
      const emp = empMap.get(r.employee_id);
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

    for (const item of result) {
      await logAudit(
        currentUser.id,
        "CREATE",
        "WORK_RECORD",
        item.id,
        null,
        JSON.stringify({
          employeeId: item.employeeId,
          workDate: item.workDate,
          dailyRate: item.dailyRate,
          status: item.status,
        })
      );
    }

    return successResponse(result, "Bulk work records created successfully", 201);
  } catch (error) {
    console.error("Bulk work record exception:", error);
    return errorResponse("Failed to bulk create work records", "INTERNAL_SERVER_ERROR", 500);
  }
}
