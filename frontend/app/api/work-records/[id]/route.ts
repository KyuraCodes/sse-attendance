import { NextRequest } from "next/server";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse, safeServerError } from "@/lib/apiResponse";
import { isValidId, sanitizeInput, sanitizeNullable } from "@/lib/security";
import {
  calculateDefaultOtRate,
  formatOtNotes,
  parseOtFromNotes,
} from "@/lib/otUtils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { id } = await params;
  const recordId = Number(id);

  if (!isValidId(recordId)) {
    return errorResponse("Invalid work record ID", "INVALID_ID", 400);
  }

  const { data: record, error } = await supabase
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
    .eq("id", recordId)
    .maybeSingle();

  if (error || !record) {
    return errorResponse("Work record not found", "NOT_FOUND", 404);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emp = record.employees as any;
  const otInfo = parseOtFromNotes(record.notes);

  return successResponse({
    id: record.id,
    employeeId: record.employee_id,
    employeeCode: emp?.employee_code || "",
    employeeName: emp?.name || "",
    workDate: record.work_date,
    dailyRate: Number(record.daily_rate),
    amount: Number(record.amount),
    hoursWorked: record.hours_worked !== null && record.hours_worked !== undefined
      ? Number(record.hours_worked)
      : undefined,
    waivedAmount: Number(record.waived_amount || 0),
    rateType: emp?.rate_type || "DAILY",
    otHours: otInfo?.otHours ?? 0,
    otRate: otInfo?.otRate ?? 0,
    otAmount: otInfo?.otAmount ?? 0,
    status: record.status,
    notes: record.notes,
    createdBy: record.created_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  // RBAC check: only CEO or ADMIN can edit work records
  if (currentUser.role !== "CEO" && currentUser.role !== "ADMIN") {
    return errorResponse("Forbidden: Only CEO or Admin can edit work records", "FORBIDDEN", 403);
  }

  const { id } = await params;
  const recordId = Number(id);

  if (!isValidId(recordId)) {
    return errorResponse("Invalid work record ID", "INVALID_ID", 400);
  }

  try {
    const body = await req.json();
    const { workDate, dailyRate, hoursWorked, otHours, otRate, notes } = body;

    // Validate workDate: required string matching YYYY-MM-DD
    if (
      !workDate ||
      typeof workDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(workDate.trim())
    ) {
      return errorResponse("Valid work date (YYYY-MM-DD) is required", "INVALID_WORK_DATE", 400);
    }
    const cleanWorkDate = sanitizeInput(workDate.trim());
    if (isNaN(Date.parse(cleanWorkDate))) {
      return errorResponse("Valid work date (YYYY-MM-DD) is required", "INVALID_WORK_DATE", 400);
    }

    // Validate dailyRate: required number >= 0 and <= 50000
    const numDailyRate = Number(dailyRate);
    if (
      dailyRate === undefined ||
      dailyRate === null ||
      isNaN(numDailyRate) ||
      numDailyRate < 0 ||
      numDailyRate > 50000
    ) {
      return errorResponse("Daily rate must be a number between 0 and 50000", "INVALID_DAILY_RATE", 400);
    }

    // Validate hoursWorked: optional number >= 0 and <= 24
    let parsedHoursWorked: number | undefined = undefined;
    if (hoursWorked !== undefined && hoursWorked !== null && hoursWorked !== "") {
      const numHours = Number(hoursWorked);
      if (isNaN(numHours) || numHours < 0 || numHours > 24) {
        return errorResponse("Hours worked must be a number between 0 and 24", "INVALID_HOURS_WORKED", 400);
      }
      parsedHoursWorked = Number(numHours.toFixed(2));
    }

    // Validate otHours: optional number >= 0 and <= 24
    let parsedOtHours: number | undefined = undefined;
    if (otHours !== undefined && otHours !== null && otHours !== "") {
      const numOtH = Number(otHours);
      if (isNaN(numOtH) || numOtH < 0 || numOtH > 24) {
        return errorResponse("OT hours must be a number between 0 and 24", "INVALID_OT_HOURS", 400);
      }
      parsedOtHours = Number(numOtH.toFixed(2));
    }

    // Validate otRate: optional number >= 0 and <= 1000
    let parsedOtRate: number | undefined = undefined;
    if (otRate !== undefined && otRate !== null && otRate !== "") {
      const numOtR = Number(otRate);
      if (isNaN(numOtR) || numOtR < 0 || numOtR > 1000) {
        return errorResponse("OT rate must be a number between 0 and 1000", "INVALID_OT_RATE", 400);
      }
      parsedOtRate = Number(numOtR.toFixed(2));
    }

    // Validate notes: optional string <= 500 chars
    if (notes !== undefined && notes !== null) {
      if (typeof notes !== "string" || notes.length > 500) {
        return errorResponse("Notes must be a string up to 500 characters", "INVALID_NOTES", 400);
      }
    }

    // Fetch existing work record from Supabase
    const { data: existingRecord, error: fetchErr } = await supabase
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
      .eq("id", recordId)
      .maybeSingle();

    if (fetchErr || !existingRecord) {
      return errorResponse("Work record not found", "NOT_FOUND", 404);
    }

    // Status locking rule: PAID records cannot be edited
    if (existingRecord.status === "PAID") {
      return errorResponse(
        "Rekod berstatus PAID tidak boleh disunting demi integriti baucar bayaran.",
        "RECORD_ALREADY_PAID",
        400
      );
    }

    // Check duplicate if workDate changed
    if (cleanWorkDate !== existingRecord.work_date) {
      const { data: duplicateRecord } = await supabase
        .from("work_records")
        .select("id")
        .eq("employee_id", existingRecord.employee_id)
        .eq("work_date", cleanWorkDate)
        .neq("id", recordId)
        .maybeSingle();

      if (duplicateRecord) {
        return errorResponse(
          "Work record already exists for this employee on this date",
          "DUPLICATE_WORK_RECORD",
          400
        );
      }
    }

    // Financial calculation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emp = existingRecord.employees as any;
    const rateType = emp?.rate_type || "DAILY";

    let baseAmount: number;
    if (parsedHoursWorked !== undefined && parsedHoursWorked !== null) {
      baseAmount = Number((parsedHoursWorked * numDailyRate).toFixed(2));
    } else if (rateType === "HOURLY") {
      const existingHours = existingRecord.hours_worked !== null && existingRecord.hours_worked !== undefined
        ? Number(existingRecord.hours_worked)
        : 0;
      baseAmount = Number((existingHours * numDailyRate).toFixed(2));
    } else {
      baseAmount = numDailyRate;
    }

    const otHoursValue = parsedOtHours ?? 0;
    let otRateValue = parsedOtRate ?? 0;
    if (otHoursValue > 0 && otRateValue === 0 && parsedOtRate === undefined) {
      otRateValue = calculateDefaultOtRate(numDailyRate, rateType);
    }

    const otAmount = Number((otHoursValue * otRateValue).toFixed(2));
    const totalAmount = Number((baseAmount + otAmount).toFixed(2));

    // Notes processing
    const incomingNotes = notes !== undefined ? notes : existingRecord.notes;
    const rawNotesText = sanitizeNullable(incomingNotes) || "";
    const cleanNotes = rawNotesText.replace(/\[OT:[^\]]*\]/gi, "").trim();

    const finalNotes = otHoursValue > 0
      ? formatOtNotes(otHoursValue, otRateValue, otAmount, cleanNotes)
      : (cleanNotes || null);

    // Update payload
    const updateData: Record<string, unknown> = {
      work_date: cleanWorkDate,
      daily_rate: numDailyRate,
      amount: totalAmount,
      notes: finalNotes,
      updated_at: new Date().toISOString(),
    };

    if (hoursWorked === null) {
      updateData.hours_worked = null;
    } else if (parsedHoursWorked !== undefined) {
      updateData.hours_worked = parsedHoursWorked;
    }

    // Update in Supabase
    const { data: updatedRecord, error: updateErr } = await supabase
      .from("work_records")
      .update(updateData)
      .eq("id", recordId)
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
      .single();

    if (updateErr || !updatedRecord) {
      return safeServerError(updateErr, "Failed to update work record", "UPDATE_FAILED");
    }

    // Audit log
    const oldValues = {
      workDate: existingRecord.work_date,
      dailyRate: Number(existingRecord.daily_rate),
      amount: Number(existingRecord.amount),
      hoursWorked: existingRecord.hours_worked !== null && existingRecord.hours_worked !== undefined
        ? Number(existingRecord.hours_worked)
        : null,
      notes: existingRecord.notes,
      status: existingRecord.status,
    };

    const newValues = {
      workDate: cleanWorkDate,
      dailyRate: numDailyRate,
      amount: totalAmount,
      hoursWorked: updatedRecord.hours_worked !== null && updatedRecord.hours_worked !== undefined
        ? Number(updatedRecord.hours_worked)
        : null,
      notes: finalNotes,
      status: existingRecord.status,
    };

    await logAudit(
      currentUser.id,
      "UPDATE",
      "work_records",
      recordId,
      JSON.stringify(oldValues),
      JSON.stringify(newValues)
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedEmp = updatedRecord.employees as any;
    const updatedOt = parseOtFromNotes(updatedRecord.notes);

    return successResponse(
      {
        id: updatedRecord.id,
        employeeId: updatedRecord.employee_id,
        employeeCode: updatedEmp?.employee_code || emp?.employee_code || "",
        employeeName: updatedEmp?.name || emp?.name || "",
        workDate: updatedRecord.work_date,
        dailyRate: Number(updatedRecord.daily_rate),
        amount: Number(updatedRecord.amount),
        hoursWorked: updatedRecord.hours_worked !== null && updatedRecord.hours_worked !== undefined
          ? Number(updatedRecord.hours_worked)
          : undefined,
        waivedAmount: Number(updatedRecord.waived_amount || 0),
        rateType: updatedEmp?.rate_type || rateType,
        otHours: updatedOt?.otHours ?? 0,
        otRate: updatedOt?.otRate ?? 0,
        otAmount: updatedOt?.otAmount ?? 0,
        status: updatedRecord.status,
        notes: updatedRecord.notes,
        createdBy: updatedRecord.created_by,
        createdAt: updatedRecord.created_at,
        updatedAt: updatedRecord.updated_at,
      },
      "Work record updated successfully"
    );
  } catch (err) {
    return safeServerError(err, "Failed to update work record");
  }
}
