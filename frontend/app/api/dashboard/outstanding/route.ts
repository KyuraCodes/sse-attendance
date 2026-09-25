import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { data: payableRecords } = await supabase
    .from("work_records")
    .select("id, amount")
    .in("status", ["UNPAID", "STORED", "PARTIALLY_PAID"]);

  const recordIds = (payableRecords || []).map((r) => r.id);
  let appliedMap: Record<number, number> = {};

  if (recordIds.length > 0) {
    const { data: items } = await supabase
      .from("payment_items")
      .select("work_record_id, amount_applied")
      .in("work_record_id", recordIds);

    if (items) {
      for (const item of items) {
        appliedMap[item.work_record_id] =
          (appliedMap[item.work_record_id] || 0) + Number(item.amount_applied);
      }
    }
  }

  let totalOutstanding = 0;
  for (const r of payableRecords || []) {
    const applied = appliedMap[r.id] || 0;
    const remaining = Number(r.amount) - applied;
    if (remaining > 0.001) {
      totalOutstanding += remaining;
    }
  }

  return successResponse(totalOutstanding, "Total outstanding salary retrieved");
}
