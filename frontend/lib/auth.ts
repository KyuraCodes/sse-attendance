import jwt from "jsonwebtoken";
import { supabase } from "./supabase";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

export interface AuthJwtPayload {
  userId: number;
  sub: string;
  role: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export function signToken(payload: {
  userId: number;
  sub: string;
  role: string;
  name: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): AuthJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthJwtPayload;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(
  request: Request
): Promise<AuthUser | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return null;
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, role, status, avatar_url, created_at")
    .eq("id", payload.userId)
    .single();

  if (error || !user || user.status !== "ACTIVE") {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
  };
}

export async function logAudit(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number,
  oldValue: string | null = null,
  newValue: string | null = null
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_value: oldValue,
      new_value: newValue,
    });
  } catch (err) {
    console.warn("Failed to write audit log:", err);
  }
}
