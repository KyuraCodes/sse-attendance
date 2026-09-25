import { NextRequest } from "next/server";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  if (currentUser.role !== "CEO" && currentUser.role !== "ADMIN") {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  const { id } = await params;
  const employeeId = Number(id);

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !["ACTIVE", "INACTIVE"].includes(status.trim().toUpperCase())) {
      return errorResponse("Status must be ACTIVE or INACTIVE", "INVALID_STATUS", 400);
    }

    const newStatus = status.trim().toUpperCase();

    const { data: existing } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .maybeSingle();

    if (!existing) {
      return errorResponse("Employee not found", "EMPLOYEE_NOT_FOUND", 404);
    }

    const { data: updated, error } = await supabase
      .from("employees")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employeeId)
      .select("id, employee_code, name, phone, address, daily_rate, start_date, status, notes, created_at, updated_at")
      .single();

    if (error || !updated) {
      return errorResponse("Failed to update employee status", "UPDATE_FAILED", 500);
    }

    await logAudit(
      currentUser.id,
      "UPDATE_STATUS",
      "EMPLOYEE",
      employeeId,
      existing.status,
      newStatus
    );

    return successResponse({
      id: updated.id,
      employeeCode: updated.employee_code,
      name: updated.name,
      phone: updated.phone,
      address: updated.address,
      dailyRate: Number(updated.daily_rate),
      startDate: updated.start_date,
      status: updated.status,
      notes: updated.notes,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  } catch (error) {
    console.error("Update employee status error:", error);
    return errorResponse("Failed to update status", "INTERNAL_SERVER_ERROR", 500);
  }
}
