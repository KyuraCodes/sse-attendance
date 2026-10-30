import { NextRequest } from "next/server";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse, safeServerError } from "@/lib/apiResponse";
import { isValidId, sanitizeNullable } from "@/lib/security";
import { parseOtFromNotes, formatOtNotes } from "@/lib/otUtils";

const VALID_STATUSES = ["UNPAID", "STORED", "PARTIALLY_PAID", "PAID", "VOID"];

export async function PATCH(
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

  try {
    const body = await req.json();
    const { status, notes } = body;

    if (!status || typeof status !== "string" || !VALID_STATUSES.includes(status.trim().toUpperCase())) {
      return errorResponse("Invalid status value", "INVALID_STATUS", 400);
    }

    const newStatus = status.trim().toUpperCase();

    const { data: existing, error: existErr } = await supabase
      .from("work_records")
      .select("id, status, notes, employee_id")
      .eq("id", recordId)
      .maybeSingle();

    if (existErr || !existing) {
      return errorResponse("Work record not found", "NOT_FOUND", 404);
    }

    const existingOt = parseOtFromNotes(existing.notes);

    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      const incomingParsed = parseOtFromNotes(notes);
      const rawNotesText = incomingParsed ? incomingParsed.cleanNotes : (typeof notes === "string" ? notes : "");
      const cleanIncoming = sanitizeNullable(rawNotesText);
      if (existingOt && existingOt.otHours > 0) {
        updates.notes = formatOtNotes(
          existingOt.otHours,
          existingOt.otRate,
          existingOt.otAmount,
          cleanIncoming
        );
      } else {
        updates.notes = cleanIncoming || null;
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from("work_records")
      .update(updates)
      .eq("id", recordId)
      .select(`
        id,
        employee_id,
        work_date,
        daily_rate,
        hours_worked,
        waived_amount,
        amount,
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

    if (updateErr || !updated) {
      return safeServerError(updateErr, "Failed to update status", "UPDATE_FAILED");
    }

    await logAudit(
      currentUser.id,
      "UPDATE_STATUS",
      "WORK_RECORD",
      recordId,
      JSON.stringify(existing),
      JSON.stringify({ status: newStatus, notes: updates.notes })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emp = updated.employees as any;
    const parsedOt = parseOtFromNotes(updated.notes);

    return successResponse({
      id: updated.id,
      employeeId: updated.employee_id,
      employeeCode: emp?.employee_code || "",
      employeeName: emp?.name || "",
      rateType: emp?.rate_type || "DAILY",
      workDate: updated.work_date,
      dailyRate: Number(updated.daily_rate),
      hoursWorked: updated.hours_worked != null ? Number(updated.hours_worked) : null,
      waivedAmount: Number(updated.waived_amount || 0),
      otHours: parsedOt?.otHours ?? 0,
      otRate: parsedOt?.otRate ?? 0,
      otAmount: parsedOt?.otAmount ?? 0,
      amount: Number(updated.amount),
      status: updated.status,
      notes: updated.notes,
      createdBy: updated.created_by,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  } catch (error) {
    return safeServerError(error, "Failed to update work record status");
  }
}
