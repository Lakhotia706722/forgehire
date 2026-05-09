import { authMiddleware, redirectToSignIn } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/login(.*)',
    '/signup(.*)',
    '/verify-otp(.*)',
    '/api/webhook(.*)',
    '/engineer/(.*)',   // public profiles
    '/marketplace/(.*)',
  ],

  afterAuth(auth, req: NextRequest) {
    const { userId, sessionClaims } = auth;
    const { pathname } = req.nextUrl;

    // Not signed in → redirect to login for protected routes
    if (!userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // Signed in → redirect away from auth pages
    if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
      const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
      const dest = role === 'company'
        ? '/company/dashboard'
        : '/engineer/dashboard';
      return NextResponse.redirect(new URL(dest, req.url));
    }

    // Role-based route protection
    if (userId) {
      const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

      if (pathname.startsWith('/engineer') && role && role !== 'engineer') {
        return NextResponse.redirect(new URL('/company/dashboard', req.url));
      }

      if (pathname.startsWith('/company') && role && role !== 'company') {
        return NextResponse.redirect(new URL('/engineer/dashboard', req.url));
      }

      // Admin route protection — only admin role can access /admin/*
      if (pathname.startsWith('/admin') && role !== 'admin') {
        const dest = role === 'company' ? '/company/dashboard' : '/engineer/dashboard';
        return NextResponse.redirect(new URL(dest, req.url));
      }
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
