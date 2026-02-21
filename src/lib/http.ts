import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string, details?: unknown): NextResponse {
  return NextResponse.json({ message, details }, { status: 400 });
}

export function notFound(message: string): NextResponse {
  return NextResponse.json({ message }, { status: 404 });
}

export function serverError(error: unknown): NextResponse {
  return NextResponse.json(
    {
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error)
    },
    { status: 500 }
  );
}
