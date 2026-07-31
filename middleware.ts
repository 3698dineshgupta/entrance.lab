import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Only admins can access /admin routes
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Pages that require being logged in
        const protectedPaths = ["/mock-tests", "/test", "/analytics", "/results", "/admin"];
        const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
        // If protected and no token, middleware will redirect to signIn page automatically
        if (isProtected) return !!token;
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/mock-tests/:path*",
    "/test/:path*",
    "/analytics/:path*",
    "/results/:path*",
    "/admin/:path*",
  ],
};
