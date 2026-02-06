import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser();

  // Admin Route Protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const isLoginPage = request.nextUrl.pathname === '/admin/login';

    // 1. If not logged in and not on login page -> Redirect to Login
    if (!user && !isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // 2. If logged in -> Check Admin Role
    if (user) {
      const { data: adminUser } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single();
      
      const isAdmin = !!adminUser;

      // 2a. If NOT admin -> Redirect to Login with error
      if (!isAdmin) {
        // Avoid infinite redirect loop if already on login page with error
        if (isLoginPage && request.nextUrl.searchParams.get('error') === 'unauthorized') {
          return response;
        }

        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }

      // 2b. If IS admin AND on login page -> Redirect to Dashboard
      if (isAdmin && isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}
