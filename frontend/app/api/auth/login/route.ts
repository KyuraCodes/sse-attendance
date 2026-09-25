import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { signToken, logAudit } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email and password are required", "INVALID_CREDENTIALS", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (error || !user) {
      return errorResponse("Invalid email or password", "BAD_CREDENTIALS", 401);
    }

    if (user.status !== "ACTIVE") {
      return errorResponse("User account is inactive", "ACCOUNT_INACTIVE", 403);
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return errorResponse("Invalid email or password", "BAD_CREDENTIALS", 401);
    }

    const token = signToken({
      userId: user.id,
      sub: user.email,
      role: user.role,
      name: user.name,
    });

    const userDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    };

    await logAudit(user.id, "LOGIN", "USER", user.id, null, "User logged in successfully");

    return successResponse({ token, user: userDto }, "Login successful");
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("An unexpected error occurred during login", "INTERNAL_SERVER_ERROR", 500);
  }
}
