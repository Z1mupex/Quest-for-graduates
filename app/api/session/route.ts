import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, parseSessionCookie } from "@/lib/auth";
import { validateCredentials } from "@/lib/data";

export async function GET() {
  const cookieStore = cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  const session = parseSessionCookie(value);
  return NextResponse.json({ session });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string;
    password?: string;
  };
  if (!body.userId || !body.password) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const user = validateCredentials(body.userId, body.password);
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const payload = JSON.stringify({
    userId: user.id,
    role: user.role,
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: encodeURIComponent(payload),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}
