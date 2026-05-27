import { authMiddleware, redirectToSignIn } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RESERVED_ENGINEER_SEGMENTS = new Set([
  'dashboard',
  'bounties',
  'profile',
  'wallet',
  'messages',
  'settings',
  'marketplace',
  'contracts',
  'assessment',
  'onboarding',
]);

const RESERVED_COMPANY_SEGMENTS = new Set([
  'dashboard',
  'tasks',
  'contracts',
  'browse',
  'messages',
  'settings',
  'analytics',
  'post-task',
  'notifications',
]);

/** Public profile pages only (single segment id, not app sections). */
function isPublicProfilePath(pathname: string): boolean {
  const engineerMatch = pathname.match(/^\/engineer\/([^/]+)$/);
  if (engineerMatch && !RESERVED_ENGINEER_SEGMENTS.has(engineerMatch[1])) {
    return true;
  }
  const companyMatch = pathname.match(/^\/company\/([^/]+)$/);
  if (companyMatch && !RESERVED_COMPANY_SEGMENTS.has(companyMatch[1])) {
    return true;
  }
  return false;
}

export default authMiddleware({
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/login(.*)',
    '/signup(.*)',
    '/verify-otp(.*)',
    '/forgot-password(.*)',
    '/reset-password(.*)',
    '/sso-callback(.*)',
    '/api/webhook(.*)',
    '/marketplace(.*)',
    '/market-rates(.*)',
    '/engineers(.*)',
    '/bounties(.*)',
    '/about(.*)',
    '/terms(.*)',
    '/privacy(.*)',
    '/offline(.*)',
  ],

  afterAuth(auth, req: NextRequest) {
    const { userId, sessionClaims } = auth;
    const { pathname } = req.nextUrl;
    const isPublic =
      auth.isPublicRoute || isPublicProfilePath(pathname);

    if (!userId && !isPublic) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
      const role = (sessionClaims?.publicMetadata as { role?: string })?.role;
      const dest = role === 'company'
        ? '/company/dashboard'
        : '/engineer/dashboard';
      return NextResponse.redirect(new URL(dest, req.url));
    }

    if (userId) {
      const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

      if (pathname.startsWith('/engineer') && role && role !== 'engineer') {
        return NextResponse.redirect(new URL('/company/dashboard', req.url));
      }

      if (pathname.startsWith('/company') && role && role !== 'company') {
        return NextResponse.redirect(new URL('/engineer/dashboard', req.url));
      }

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
