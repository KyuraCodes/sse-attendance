/**
 * Security utilities based on OWASP Top 10 and Anthropic Cybersecurity Guidelines.
 * Protects against XSS, input manipulation, and sensitive information leakage.
 */

/**
 * Strips dangerous HTML tags, javascript protocols, and risky event attributes.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove javascript: and data: urls
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:text\/html/gi, "")
    // Remove inline event handlers (e.g. onload=, onerror=, onclick=)
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^>\s]+/gi, "")
    // Strip HTML opening and closing tags
    .replace(/<[^>]*>?/gm, "")
    .trim();
}

/**
 * Safely sanitizes string or returns undefined if null/undefined.
 */
export function sanitizeNullable(input: string | null | undefined): string | undefined {
  if (input === null || input === undefined) {
    return undefined;
  }
  return sanitizeInput(input);
}

/**
 * Validates that an ID is a safe positive integer.
 */
export function isValidId(id: unknown): boolean {
  if (typeof id === "number") {
    return Number.isInteger(id) && id > 0 && id <= Number.MAX_SAFE_INTEGER;
  }
  if (typeof id === "string") {
    const num = Number(id);
    return Number.isInteger(num) && num > 0 && num.toString() === id.trim();
  }
  return false;
}

/**
 * Masks internal database, SQL, or stack-trace details from public API responses.
 * Logs full diagnostic trace safely on the server side.
 */
export function maskSensitiveError(err: unknown, fallbackMessage: string = "An internal error occurred"): string {
  if (process.env.NODE_ENV !== "production") {
    console.error("[SECURITY LOG - SERVER INTERNAL ERROR]:", err);
  } else {
    // In production, log without leaking PII
    console.error("[SERVER ERROR]:", err instanceof Error ? err.message : "Unknown error");
  }

  // Never return raw database connection errors, table names, or postgres error codes
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes("relation") ||
      msg.includes("column") ||
      msg.includes("supabase") ||
      msg.includes("postgres") ||
      msg.includes("syntax error") ||
      msg.includes("violates")
    ) {
      return fallbackMessage;
    }
  }

  return fallbackMessage;
}
