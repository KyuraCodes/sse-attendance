import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  return successResponse(currentUser, "Current user retrieved");
}
