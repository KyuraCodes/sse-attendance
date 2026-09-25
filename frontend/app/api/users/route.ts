import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthenticatedUser, logAudit } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, email, role, status, avatar_url, created_at")
    .order("id", { ascending: true });

  if (error) {
    return errorResponse("Failed to fetch users", "FETCH_FAILED", 500);
  }

  const result = (users || []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    avatarUrl: u.avatar_url,
    createdAt: u.created_at,
  }));

  return successResponse(result, "Users retrieved");
}

export async function POST(req: NextRequest) {
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
  }

  if (currentUser.role !== "CEO" && currentUser.role !== "ADMIN") {
    return errorResponse("Access denied", "FORBIDDEN", 403);
  }

  try {
    const body = await req.json();
    const { name, email, password, role, status, avatarUrl } = body;

    if (!name || !email || !password || !role) {
      return errorResponse("Name, email, password, and role are required", "INVALID_INPUT", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role.trim().toUpperCase();

    if (!["CEO", "ADMIN", "MANAGER"].includes(normalizedRole)) {
      return errorResponse("Invalid role. Must be CEO, ADMIN, or MANAGER", "INVALID_ROLE", 400);
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      return errorResponse("Email already registered", "EMAIL_EXISTS", 409);
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        role: normalizedRole,
        status: status ? status.trim().toUpperCase() : "ACTIVE",
        avatar_url: avatarUrl || null,
      })
      .select("id, name, email, role, status, avatar_url, created_at")
      .single();

    if (error || !newUser) {
      return errorResponse("Failed to create user", "INSERT_FAILED", 500);
    }

    await logAudit(
      currentUser.id,
      "CREATE",
      "USER",
      newUser.id,
      null,
      `Created user: ${newUser.email} (${newUser.role})`
    );

    return successResponse(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        avatarUrl: newUser.avatar_url,
        createdAt: newUser.created_at,
      },
      "User created successfully",
      201
    );
  } catch (error) {
    console.error("Create user error:", error);
    return errorResponse("Failed to create user", "INTERNAL_SERVER_ERROR", 500);
  }
}
