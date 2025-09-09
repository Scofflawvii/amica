import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle PWA-related files in development to prevent 404s
  if (process.env.NODE_ENV === "development") {
    // Return empty JS for workbox files
    if (pathname.includes("workbox-") && pathname.endsWith(".js")) {
      return new NextResponse("/* workbox disabled in development */", {
        status: 200,
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // Return empty JSON for dynamic CSS manifest
    if (pathname === "/_next/dynamic-css-manifest.json") {
      return NextResponse.json({}, { status: 200 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
