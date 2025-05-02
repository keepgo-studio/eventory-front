import { NextRequest, NextResponse } from "next/server";
import { REDIRECT_TO_KEY, FB_TOKEN_KEY } from "./lib/vars";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(FB_TOKEN_KEY)?.value;
  const pathname = request.nextUrl.pathname;

  const isPublicPath =
    pathname === "/" || // ✅ /
    /^\/events$/.test(pathname) || // ✅ events/*
    /^\/events\/(?!form$)[a-zA-Z0-9_-]+$/.test(pathname) || // ❌ /events/form/*
    pathname.startsWith("/api"); // ✅ /api/*

  const authPath = "/login";

  if (isPublicPath) {
    return NextResponse.next();
  }

  // if entered to auth-needed path,
  // redirect to /login if the user is unsigned
  if (!token && pathname !== authPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(REDIRECT_TO_KEY, pathname);
    
    return NextResponse.redirect(loginUrl);
  }

  // if user is logged in, redirect to previous path
  if (token && pathname === authPath) {
    const redirectTo = request.nextUrl.searchParams.get(REDIRECT_TO_KEY) || "/";

    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, fonts, manifest (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|manifest).*)",
  ],
};
