import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // STRICT EXCLUSION: Skip middleware for OTP and Bottle Check APIs
  const { pathname } = request.nextUrl;
  
  if (
    pathname.startsWith('/api/otp') || 
    pathname.startsWith('/api/bottles') ||
    pathname.startsWith('/scan')
  ) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/otp (OTP flow - pure 2Factor)
     * - api/bottles (Bottle check - public)
     * - scan (Scan page - public)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/otp|api/bottles|scan).*)',
  ],
};
