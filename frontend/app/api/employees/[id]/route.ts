import { NextRequest } from "next/server";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import { RateType } from "@/types/employee";

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

  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, employee_code, name, phone, address, daily_rate, rate_type, start_date, status, notes, created_at, updated_at")
    .eq("id", employeeId)
    .maybeSingle();

  if (error || !employee) {
    return errorResponse("Employee not found", "EMPLOYEE_NOT_FOUND", 404);
  }

  return successResponse({
    id: employee.id,
    employeeCode: employee.employee_code,
    name: employee.name,
    phone: employee.phone,
    address: employee.address,
    dailyRate: Number(employee.daily_rate),
    rateType: (employee.rate_type as RateType) || "DAILY",
    startDate: employee.start_date,
    status: employee.status,
    notes: employee.notes,
    createdAt: employee.created_at,
    updatedAt: employee.updated_at,
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

  if (currentUser.role !== "CEO" && currentUser.role !== "ADMIN") {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  const { id } = await params;
  const employeeId = Number(id);

  try {
    const body = await req.json();
    const { name, phone, address, dailyRate, rateType, startDate, status, notes } = body;

    const { data: existing } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .maybeSingle();

    if (!existing) {
      return errorResponse("Employee not found", "EMPLOYEE_NOT_FOUND", 404);
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (!name.trim()) return errorResponse("Name cannot be empty", "INVALID_NAME", 400);
      updates.name = name.trim();
    }
    if (phone !== undefined) updates.phone = phone ? phone.trim() : null;
    if (address !== undefined) updates.address = address ? address.trim() : null;
    if (dailyRate !== undefined) {
      const rate = Number(dailyRate);
      if (isNaN(rate) || rate <= 0) {
        return errorResponse("Daily rate must be greater than 0", "INVALID_DAILY_RATE", 400);
      }
      updates.daily_rate = rate;
    }
    if (rateType !== undefined) {
      const normalizedRateType = String(rateType).toUpperCase();
      const validRateTypes: RateType[] = ["HOURLY", "DAILY", "WEEKLY", "MONTHLY"];
      if (!validRateTypes.includes(normalizedRateType as RateType)) {
        return errorResponse(
          "Invalid rate type. Allowed: HOURLY, DAILY, WEEKLY, MONTHLY",
          "INVALID_RATE_TYPE",
          400
        );
      }
      updates.rate_type = normalizedRateType;
    }
    if (startDate !== undefined) updates.start_date = startDate;
    if (status !== undefined) updates.status = status.trim().toUpperCase();
    if (notes !== undefined) updates.notes = notes ? notes.trim() : null;

    const { data: updated, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", employeeId)
      .select("id, employee_code, name, phone, address, daily_rate, rate_type, start_date, status, notes, created_at, updated_at")
      .single();

    if (error || !updated) {
      console.error("Update employee error:", error);
      return errorResponse("Failed to update employee", "UPDATE_FAILED", 500);
    }

    await logAudit(
      currentUser.id,
      "UPDATE",
      "EMPLOYEE",
      employeeId,
      JSON.stringify(existing),
      JSON.stringify(updated)
    );

    return successResponse({
      id: updated.id,
      employeeCode: updated.employee_code,
      name: updated.name,
      phone: updated.phone,
      address: updated.address,
      dailyRate: Number(updated.daily_rate),
      rateType: (updated.rate_type as RateType) || "DAILY",
      startDate: updated.start_date,
      status: updated.status,
      notes: updated.notes,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  } catch (error) {
    console.error("Update employee exception:", error);
    return errorResponse("Failed to update employee", "INTERNAL_SERVER_ERROR", 500);
  }
}

export async function DELETE(
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

  const { data: existing } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .maybeSingle();

  if (!existing) {
    return errorResponse("Employee not found", "EMPLOYEE_NOT_FOUND", 404);
  }

  // Delete associated records
  await supabase.from("payments").delete().eq("employee_id", employeeId);
  await supabase.from("work_records").delete().eq("employee_id", employeeId);
  const { error } = await supabase.from("employees").delete().eq("id", employeeId);

  if (error) {
    console.error("Delete employee error:", error);
    return errorResponse("Failed to delete employee", "DELETE_FAILED", 500);
  }

  await logAudit(
    currentUser.id,
    "DELETE",
    "EMPLOYEE",
    employeeId,
    JSON.stringify(existing),
    null
  );

  return successResponse(null, "Employee deleted successfully");
}
