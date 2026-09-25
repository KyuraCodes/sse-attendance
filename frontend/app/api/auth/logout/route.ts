import { NextRequest } from "next/server";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { successResponse } from "@/lib/apiResponse";

export async function POST(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (currentUser) {
    await logAudit(currentUser.id, "LOGOUT", "USER", currentUser.id, null, "User logged out");
  }

  return successResponse(null, "Logout successful");
}
