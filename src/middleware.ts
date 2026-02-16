import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Create an initial response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Admin Route Logic
  if (pathname.startsWith("/admin")) {
    
    // Case A: User is accessing /admin/login
    if (pathname === "/admin/login") {
      if (user) {
        // Logged-in admin should not see login page
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      // Unauthenticated user can see login page
      return response;
    }

    // Case B: User is accessing other /admin routes
    if (!user) {
      // Allow access to public admin assets or redirect to login?
      // Matcher ensures we are here, so we must protect.
      // Redirect unauthenticated users to login
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      
      // Optional: Add next param for redirect back after login
      // url.searchParams.set("next", pathname);
      
      return NextResponse.redirect(url);
    }

    // Case C: Authenticated user accessing protected /admin route -> Allow
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
