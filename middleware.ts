import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

// Locales supported by the app
const locales = ["ro", "ru", "en"] as const;
type AppLocale = (typeof locales)[number];

function detectLocale(req: NextRequest): AppLocale {
  // 1) Persisted choice from next-intl
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value as AppLocale | undefined;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2) Basic Accept-Language detection (very simple)
  // Prefer Romanian, then Russian, then English
  const header = req.headers.get("accept-language") || "";
  if (/\bro\b/i.test(header)) return "ro";
  if (/\bru\b/i.test(header)) return "ru";
  if (/\ben\b/i.test(header)) return "en";

  // 3) Fallback
  return "ro";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip next internals and public files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    /\.[\w-]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Extract locale (if present) and the rest of the path
  const localeMatch = pathname.match(new RegExp(`^/(?:${locales.join("|")})(?:/|$)`));
  const hasLocale = Boolean(localeMatch);

  // Auth gating for admin pages (login/dashboard) respecting locale
  const authToken = req.cookies.get("auth_token")?.value;
  // normalize segment path without the locale prefix
  const withoutLocale = hasLocale ? pathname.replace(/^\/[^/]+/, "") || "/" : pathname;
  const isDashboard = withoutLocale.startsWith("/dashboard");
  const isLogin = withoutLocale === "/login" || withoutLocale.startsWith("/login/");

  if (isDashboard && !authToken) {
    const url = req.nextUrl.clone();
    const targetLocale = hasLocale ? (pathname.split("/")[1] as AppLocale) : detectLocale(req);
    url.pathname = `/${targetLocale}/login`;
    return NextResponse.redirect(url);
  }

  if (isLogin && authToken) {
    const url = req.nextUrl.clone();
    const targetLocale = hasLocale ? (pathname.split("/")[1] as AppLocale) : detectLocale(req);
    url.pathname = `/${targetLocale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // If pathname already starts with a supported locale, continue for normal pages
  if (hasLocale) {
    return NextResponse.next();
  }

  // Otherwise, redirect by prefixing the detected (or default) locale
  const locale = detectLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

// Apply to all paths except next internals and files
export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
