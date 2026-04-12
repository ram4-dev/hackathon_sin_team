import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/map(.*)",
  "/builders(.*)",
  "/hackathons(.*)",
  "/api/builders(.*)",
  "/api/hackathons(.*)",
  "/api/cron/(.*)",
]);

export const proxy = clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/map", request.url));
  }
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
