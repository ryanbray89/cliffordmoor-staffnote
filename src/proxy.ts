import { NextResponse, type NextRequest } from "next/server";

import { verifyOfficeToken } from "@/lib/office-cookie";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const allowed = await verifyOfficeToken(
    process.env.ADMIN_PIN ?? "",
    request.cookies.get("cmf_office")?.value,
  );
  if (allowed) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return new NextResponse("The office is locked.", { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
