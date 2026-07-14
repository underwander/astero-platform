import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

const ADMIN_ROLES = new Set(["ADMIN", "MANAGER"]);

function applySecurityHeaders(response: NextResponse) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://*.tradingview.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://s.tradingview.com https://*.tradingview.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");

  return response;
}

function unauthorized(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto");
  const isLocalhost = ["localhost", "127.0.0.1"].some((host) => request.nextUrl.hostname.includes(host));

  if (process.env.NODE_ENV === "production" && proto === "http" && !isLocalhost) {
    const secureUrl = request.nextUrl.clone();
    secureUrl.protocol = "https:";
    return applySecurityHeaders(NextResponse.redirect(secureUrl, 308));
  }

  const pathname = request.nextUrl.pathname;
  const needsAdminSession = pathname === "/crm" || pathname.startsWith("/api/admin");
  const needsUserSession =
    pathname.startsWith("/api/user") ||
    pathname.startsWith("/api/trade") ||
    pathname === "/api/trades" ||
    pathname.startsWith("/api/deposits") ||
    pathname.startsWith("/api/withdrawals");

  if (needsAdminSession) {
    const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

    if (!session || !ADMIN_ROLES.has(session.role)) {
      return applySecurityHeaders(unauthorized(request));
    }

    if (pathname.startsWith("/api/admin/security") && session.role !== "ADMIN") {
      return applySecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
    }
  }

  if (needsUserSession) {
    const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

    if (!session) {
      return applySecurityHeaders(unauthorized(request));
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|manifest.webmanifest|sw.js).*)",
  ],
};
