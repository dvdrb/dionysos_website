// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Dacă utilizatorul încearcă să acceseze dashboard-ul FĂRĂ cookie, îl trimitem la login
  if (pathname.startsWith("/dashboard") && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Dacă utilizatorul este deja logat și încearcă să acceseze pagina de login, îl trimitem la dashboard
  if (pathname.startsWith("/login") && authToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Aplicăm middleware-ul doar pe rutele de login și dashboard
  matcher: ["/dashboard/:path*", "/login"],
};
