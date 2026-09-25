import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { id } = await params;
  const userId = Number(id);

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, role, status, avatar_url, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !user) {
    return errorResponse("User not found", "USER_NOT_FOUND", 404);
  }

  return successResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
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
  const userId = Number(id);

  try {
    const body = await req.json();
    const { name, email, role, status, password, avatarUrl } = body;

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!existingUser) {
      return errorResponse("User not found", "USER_NOT_FOUND", 404);
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name) updates.name = name.trim();
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const { data: duplicate } = await supabase
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .neq("id", userId)
        .maybeSingle();

      if (duplicate) {
        return errorResponse("Email already in use", "EMAIL_EXISTS", 409);
      }
      updates.email = normalizedEmail;
    }
    if (role) {
      const normalizedRole = role.trim().toUpperCase();
      if (!["CEO", "ADMIN", "MANAGER"].includes(normalizedRole)) {
        return errorResponse("Invalid role", "INVALID_ROLE", 400);
      }
      updates.role = normalizedRole;
    }
    if (status) updates.status = status.trim().toUpperCase();
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
    if (password && password.trim().length >= 6) {
      updates.password_hash = bcrypt.hashSync(password.trim(), 10);
    }

    const { data: updated, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select("id, name, email, role, status, avatar_url, created_at")
      .single();

    if (error || !updated) {
      return errorResponse("Failed to update user", "UPDATE_FAILED", 500);
    }

    await logAudit(
      currentUser.id,
      "UPDATE",
      "USER",
      userId,
      JSON.stringify(existingUser),
      JSON.stringify(updated)
    );

    return successResponse({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      status: updated.status,
      avatarUrl: updated.avatar_url,
      createdAt: updated.created_at,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return errorResponse("Failed to update user", "INTERNAL_SERVER_ERROR", 500);
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
  const userId = Number(id);

  if (currentUser.id === userId) {
    return errorResponse("Cannot delete your own account", "CANNOT_DELETE_SELF", 400);
  }

  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) {
    return errorResponse("Failed to delete user", "DELETE_FAILED", 500);
  }

  await logAudit(currentUser.id, "DELETE", "USER", userId, null, "User deleted");

  return successResponse(null, "User deleted successfully");
}
