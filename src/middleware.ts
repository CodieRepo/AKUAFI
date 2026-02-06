import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
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
    // Scoping middleware to Admin & Auth routes only as per strict user request.
    // NOTE: This effectively disables session refreshing for other routes (e.g. /client, /scan).
    '/admin/:path*',
  ],
};
