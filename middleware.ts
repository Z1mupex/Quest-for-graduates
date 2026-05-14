import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSessionCookie } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const cookie = request.cookies.get("quest_session")?.value;
  const session = cookie ? parseSessionCookie(cookie) : null;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (session.role !== "team") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/task")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "team") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/task/:path*", "/admin/:path*"],
};
