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
    // We KEEP the admin role check here because the Admin Layout might not enforce it strictly enough
    // or to prevent "flicker" of admin dashboard for non-admins.
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
      return response;
    }

    // 3. Logged In & Is Admin -> Redirect Login to Dashboard
    if (isAdmin && isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
    
    return response;
  }
  
  // Explicitly protect /api/admin for non-admin users (redundant but safe)
  if (path.startsWith('/api/admin')) {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // Role check happens in Branch 1 or via RLS/API logic if not caught there.
      // But strictly speaking, if we are here, we are NOT in /admin path??
      // Wait, path.startsWith('/admin') covers /api/admin??
      // NO. /api/admin DOES NOT start with /admin. It starts with /api.
      // So checking /api/admin here is ESSENTIAL.
      
      // Check Admin Role for API access outside of /admin route block
      const { data: adminUser } = await supabase
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single();
        
       if (!adminUser) {
           return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
       }
  }

  // --- BRANCH 2: CLIENT/PROTECTED ROUTES ---
  // Allow /client/*, Layout will handle role checks.
  // Allow /login, Page will handle session guard.
  
  return response;
}
