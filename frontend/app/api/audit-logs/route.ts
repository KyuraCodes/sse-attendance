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
  const action = searchParams.get("action");
  const entityType = searchParams.get("entityType");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  let query = supabase
    .from("audit_logs")
    .select("id, user_id, action, entity_type, entity_id, old_value, new_value, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (action && action !== "ALL") {
    query = query.eq("action", action.toUpperCase());
  }

  if (entityType && entityType !== "ALL") {
    query = query.eq("entity_type", entityType.toUpperCase());
  }

  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data: logs, error } = await query;
  if (error) {
    console.error("Fetch audit logs error:", error);
    return errorResponse("Failed to fetch audit logs", "FETCH_FAILED", 500);
  }

  const userIds = Array.from(new Set((logs || []).map((l) => l.user_id).filter(Boolean)));
  let userMap: Record<number, { name: string; email: string }> = {};

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", userIds);

    if (users) {
      for (const u of users) {
        userMap[u.id] = { name: u.name, email: u.email };
      }
    }
  }

  const result = (logs || []).map((l) => {
    const u = l.user_id ? userMap[l.user_id] : null;
    return {
      id: l.id,
      userId: l.user_id,
      userName: u?.name || "System",
      userEmail: u?.email || null,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      oldValue: l.old_value,
      newValue: l.new_value,
      createdAt: l.created_at,
    };
  });

  return successResponse(result, "Audit logs retrieved");
}
