import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/admin/login" || path === "/admin/setup") return NextResponse.next();
  // Full session and role checks happen beside the data in pages, actions and routes.
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
