import { NextResponse } from "next/server";

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
