import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function PUT(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse("Current password and new password are required", "INVALID_INPUT", 400);
    }

    if (newPassword.length < 6) {
      return errorResponse("New password must be at least 6 characters", "INVALID_PASSWORD_LENGTH", 400);
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", currentUser.id)
      .single();

    if (error || !user) {
      return errorResponse("User not found", "USER_NOT_FOUND", 404);
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      return errorResponse("Current password is incorrect", "INCORRECT_PASSWORD", 400);
    }

    const newHash = bcrypt.hashSync(newPassword, 10);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentUser.id);

    if (updateError) {
      return errorResponse("Failed to update password", "UPDATE_FAILED", 500);
    }

    await logAudit(
      currentUser.id,
      "CHANGE_PASSWORD",
      "USER",
      currentUser.id,
      null,
      "Password updated"
    );

    return successResponse(null, "Password changed successfully");
  } catch (error) {
    console.error("Password change error:", error);
    return errorResponse("Failed to change password", "INTERNAL_SERVER_ERROR", 500);
  }
}
