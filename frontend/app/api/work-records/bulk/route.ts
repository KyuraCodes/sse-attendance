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
    const { workDate, employeeIds, entries, notes } = body;

    if (!workDate) {
      return errorResponse("Work date is required", "INVALID_WORK_DATE", 400);
    }

    let normalizedEntries: {
      employeeId: number;
      hoursWorked?: number;
      amount?: number;
    }[] = [];

    if (entries && Array.isArray(entries) && entries.length > 0) {
      normalizedEntries = entries.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: any) => ({
          employeeId: Number(e.employeeId),
          hoursWorked:
            e.hoursWorked !== undefined &&
            e.hoursWorked !== null &&
            !isNaN(Number(e.hoursWorked))
              ? Number(e.hoursWorked)
              : undefined,
          amount:
            e.amount !== undefined &&
            e.amount !== null &&
            !isNaN(Number(e.amount))
              ? Number(e.amount)
              : undefined,
        })
      );
    } else if (
      employeeIds &&
      Array.isArray(employeeIds) &&
      employeeIds.length > 0
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      normalizedEntries = employeeIds.map((id: any) => ({
        employeeId: Number(id),
      }));
    } else {
      return errorResponse(
        "Employee IDs list cannot be empty",
        "INVALID_EMPLOYEE_LIST",
        400
      );
    }

    const employeeIdList = normalizedEntries.map((e) => e.employeeId);
    if (employeeIdList.some((id) => !id || isNaN(id))) {
      return errorResponse(
        "Invalid employee ID in request",
        "INVALID_EMPLOYEE_ID",
        400
      );
    }

    const uniqueIds = Array.from(new Set(employeeIdList));
    if (uniqueIds.length !== employeeIdList.length) {
      return errorResponse(
        "Duplicate employee IDs in request",
        "DUPLICATE_EMPLOYEE_IN_REQUEST",
        400
      );
    }

    const { data: employees, error: empErr } = await supabase
      .from("employees")
      .select("id, employee_code, name, daily_rate, status, rate_type")
      .in("id", uniqueIds);

    if (empErr || !employees || employees.length !== uniqueIds.length) {
      return errorResponse(
        "One or more employees not found",
        "EMPLOYEE_NOT_FOUND",
        404
      );
    }

    const inactive = employees.find((e) => e.status === "INACTIVE");
    if (inactive) {
      return errorResponse(
        `Inactive employee cannot be assigned work records: ${inactive.name}`,
        "EMPLOYEE_INACTIVE",
        400
      );
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

    const entryMap = new Map(normalizedEntries.map((e) => [e.employeeId, e]));

    const newRecordsToInsert: Array<{
      employee_id: number;
      work_date: string;
      daily_rate: number;
      amount: number;
      hours_worked: number | null;
      status: string;
      waived_amount: number;
      notes: string | null;
      created_by: number;
    }> = [];

    for (const emp of employees) {
      const entry = entryMap.get(emp.id);
      const rateType = emp.rate_type || "DAILY";
      const customAmount =
        entry?.amount !== undefined && !isNaN(Number(entry.amount))
          ? Number(entry.amount)
          : undefined;

      let finalAmount: number;
      let recordHoursWorked: number | null = null;

      if (rateType === "HOURLY") {
        let hours = 8;
        if (entry?.hoursWorked !== undefined && entry?.hoursWorked !== null) {
          const parsedHours = Number(entry.hoursWorked);
          if (isNaN(parsedHours) || parsedHours <= 0) {
            return errorResponse(
              `Hours worked must be greater than 0 for hourly employee: ${emp.name}`,
              "INVALID_HOURS_WORKED",
              400
            );
          }
          hours = parsedHours;
        }
        recordHoursWorked = hours;
        const calculatedAmount = Number(
          (hours * Number(emp.daily_rate)).toFixed(2)
        );
        finalAmount =
          customAmount !== undefined ? customAmount : calculatedAmount;
      } else if (rateType === "WEEKLY") {
        const calculatedAmount = Number(
          (Number(emp.daily_rate) / 6).toFixed(2)
        );
        finalAmount =
          customAmount !== undefined ? customAmount : calculatedAmount;
        if (
          entry?.hoursWorked !== undefined &&
          entry?.hoursWorked !== null &&
          !isNaN(Number(entry.hoursWorked)) &&
          Number(entry.hoursWorked) > 0
        ) {
          recordHoursWorked = Number(entry.hoursWorked);
        }
      } else if (rateType === "MONTHLY") {
        const calculatedAmount = Number(
          (Number(emp.daily_rate) / 26).toFixed(2)
        );
        finalAmount =
          customAmount !== undefined ? customAmount : calculatedAmount;
        if (
          entry?.hoursWorked !== undefined &&
          entry?.hoursWorked !== null &&
          !isNaN(Number(entry.hoursWorked)) &&
          Number(entry.hoursWorked) > 0
        ) {
          recordHoursWorked = Number(entry.hoursWorked);
        }
      } else {
        // DAILY (default)
        finalAmount =
          customAmount !== undefined ? customAmount : Number(emp.daily_rate);
        if (
          entry?.hoursWorked !== undefined &&
          entry?.hoursWorked !== null &&
          !isNaN(Number(entry.hoursWorked)) &&
          Number(entry.hoursWorked) > 0
        ) {
          recordHoursWorked = Number(entry.hoursWorked);
        }
      }

      newRecordsToInsert.push({
        employee_id: emp.id,
        work_date: workDate,
        daily_rate: Number(emp.daily_rate),
        amount: finalAmount,
        hours_worked: recordHoursWorked,
        status: "UNPAID",
        waived_amount: 0.0,
        notes: notes ? notes.trim() : null,
        created_by: currentUser.id,
      });
    }

    const { data: insertedRecords, error: insertErr } = await supabase
      .from("work_records")
      .insert(newRecordsToInsert)
      .select(
        "id, employee_id, work_date, daily_rate, amount, hours_worked, waived_amount, status, notes, created_by, created_at, updated_at"
      );

    if (insertErr || !insertedRecords) {
      console.error("Bulk work records error:", insertErr);
      return errorResponse(
        "Failed to create bulk work records",
        "INSERT_FAILED",
        500
      );
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
        hoursWorked:
          r.hours_worked !== null && r.hours_worked !== undefined
            ? Number(r.hours_worked)
            : undefined,
        waivedAmount: Number(r.waived_amount || 0),
        rateType: emp?.rate_type || "DAILY",
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
          amount: item.amount,
          hoursWorked: item.hoursWorked,
          status: item.status,
        })
      );
    }

    return successResponse(
      result,
      "Bulk work records created successfully",
      201
    );
  } catch (error) {
    console.error("Bulk work record exception:", error);
    return errorResponse(
      "Failed to bulk create work records",
      "INTERNAL_SERVER_ERROR",
      500
    );
  }
}
