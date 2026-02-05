import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // STEP 3 DEBUG: Verify Middleware Cookie
  // Note: The cookie name might vary depending on configuration, usually starts with 'sb-'
  const allCookies = request.cookies.getAll();
  const sbCookie = allCookies.find(c => c.name.includes('access-token'));
  console.log("MIDDLEWARE COOKIES FOUND:", allCookies.map(c => c.name));
  console.log("MIDDLEWARE SB COOKIE:", sbCookie ? "FOUND" : "MISSING");

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - auth (auth callback page)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|login|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
