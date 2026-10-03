import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { signToken, logAudit } from "@/lib/auth";
import { successResponse, errorResponse, safeServerError } from "@/lib/apiResponse";
import { sanitizeInput } from "@/lib/security";

// Constant dummy hash for constant-time comparison to prevent user enumeration
const DUMMY_HASH = "$2a$10$e7K429h5wX75x3p0U2eUeOD7h0iP2uRkF1qIq2p1e0yUeOD7h0iP2";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return errorResponse("Email and password are required", "INVALID_CREDENTIALS", 400);
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role, status, avatar_url, created_at, password_hash")
      .eq("email", sanitizedEmail)
      .maybeSingle();

    if (error || !user) {
      // Perform constant-time dummy compare to prevent user enumeration timing attacks
      bcrypt.compareSync(password, DUMMY_HASH);
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
    return safeServerError(error, "An unexpected error occurred during login");
  }
}
