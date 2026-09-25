import { NextRequest } from "next/server";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

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

  try {
    const body = await req.json();
    const { status, notes } = body;

    if (!status || !VALID_STATUSES.includes(status.trim().toUpperCase())) {
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

    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updates.notes = notes ? notes.trim() : null;
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
      .single();

    if (updateErr || !updated) {
      console.error("Update work record status error:", updateErr);
      return errorResponse("Failed to update status", "UPDATE_FAILED", 500);
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

    return successResponse({
      id: updated.id,
      employeeId: updated.employee_id,
      employeeCode: emp?.employee_code || "",
      employeeName: emp?.name || "",
      workDate: updated.work_date,
      dailyRate: Number(updated.daily_rate),
      amount: Number(updated.amount),
      status: updated.status,
      notes: updated.notes,
      createdBy: updated.created_by,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  } catch (error) {
    console.error("Update work record status exception:", error);
    return errorResponse("Failed to update work record status", "INTERNAL_SERVER_ERROR", 500);
  }
}
