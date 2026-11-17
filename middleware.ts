import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED = [
  '/dashboard',
  '/projects',
  '/new',
  '/programs',
  '/channels',
  '/calendar',
  '/users',
  '/reports',
  '/settings',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user} } = await sb.auth.getUser();

  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!user && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (user && (pathname === '/login' || pathname === '/')) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};