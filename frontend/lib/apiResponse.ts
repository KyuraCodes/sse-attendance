import { NextResponse } from "next/server";
import { maskSensitiveError } from "./security";

export function successResponse<T>(data: T, message: string = "Success", status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function errorResponse(message: string, code: string = "BAD_REQUEST", status: number = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
      code,
    },
    { status }
  );
}

export function safeServerError(
  err: unknown,
  userMessage: string = "An unexpected server error occurred. Please try again later.",
  code: string = "INTERNAL_SERVER_ERROR"
) {
  const maskedMessage = maskSensitiveError(err, userMessage);
  return errorResponse(maskedMessage, code, 500);
}
