import { NextRequest } from "next/server";
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
    const { name, avatarUrl } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", currentUser.id)
      .select("id, name, email, role, status, avatar_url, created_at")
      .single();

    if (error || !updatedUser) {
      return errorResponse("Failed to update profile", "UPDATE_FAILED", 500);
    }

    await logAudit(
      currentUser.id,
      "UPDATE_PROFILE",
      "USER",
      currentUser.id,
      JSON.stringify(currentUser),
      JSON.stringify(updatedUser)
    );

    return successResponse(
      {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        avatarUrl: updatedUser.avatar_url,
        createdAt: updatedUser.created_at,
      },
      "Profile updated successfully"
    );
  } catch (error) {
    console.error("Profile update error:", error);
    return errorResponse("Failed to update profile", "INTERNAL_SERVER_ERROR", 500);
  }
}
