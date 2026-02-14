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

  // Refresh auth token
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // --- BRANCH 1: ADMIN ROUTES ---
  if (path.startsWith('/admin')) {
    const isLoginPage = path === '/admin/login';

    // 1. Not Logged In
    if (!user) {
      if (path.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
      }
      return response; // Allow access to login page
    }

    // 2. Logged In -> Check Admin Role
    const { data: adminUser } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single();
    
    const isAdmin = !!adminUser;

    if (!isAdmin) {
      // Logged in but NOT admin
      if (path.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Redirect to /admin/login with error for UI
      if (!isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('error', 'unauthorized');
        await supabase.auth.signOut(); // Force signout to prevent loop
        return NextResponse.redirect(url);
      }
      // If already on login page (likely redirected), allow it to show error
      if (request.nextUrl.searchParams.get('error') === 'unauthorized') {
          return response;
      }
    }

    // 3. Logged In & Is Admin -> Redirect Login to Dashboard
    if (isAdmin && isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
    
    // Allow access to other admin routes
    return response;
  }
  
  // Explicitly protect /api/admin if not caught above (though startsWith /admin covers it)
  // This is a failsafe if routing logic changes
  if (path.startsWith('/api/admin')) {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // We already checked admin role above if it fell into /admin block, 
      // but if we had separate logic, we'd check it here too.
  }

  // --- BRANCH 2: CLIENT/PROTECTED ROUTES ---
  // Assuming strict separation: anything NOT /admin is Client territory.
  // We explicitly protect "/client" routes.
  // Public routes (/, /about, /login, etc.) are implicitly allowed unless matched here.
  
  if (path.startsWith('/client')) {
    // 1. Not Logged In -> Redirect to /login
    if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // 2. Logged In -> Allow access
    // Note: We don't check 'users' table here strictly because any valid auth user is a client 
    // unless you want to block admins from client routes.
    // Ideally, admins shouldn't use client routes, but if they do, they are just "users".
    
    return response;
  }

  // --- BRANCH 3: PUBLIC ROUTES ---
  // Allow everything else
  return response;
}
