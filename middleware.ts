import { type NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rootDomain } from '@/lib/utils';
import { hasAnyRole, normalizeRoles, type RoleName } from '@/lib/rbac';

const SUPPORTED_LANGS = ['en', 'it'];

const RBAC_RULES: Array<{
  pattern: RegExp;
  requiredRoles: RoleName[];
}> = [
  { pattern: /^\/admin/, requiredRoles: ['admin'] },
  {
    pattern: /^\/dashboard/,
    requiredRoles: ['user_free', 'premium_base', 'premium_pro', 'platinum', 'partner_consulente', 'admin']
  },
  {
    pattern: /^\/partner/,
    requiredRoles: ['partner_consulente', 'admin']
  }
];

const PUBLIC_PATHS = new Set<string>([
  '/login',
  '/signup',
  '/reset'
]);

function resolveLocaleRedirect(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const lang = segments[0];
  if (lang && SUPPORTED_LANGS.includes(lang)) {
    return `/${lang}/login`;
  }
  return '/en/login';
}

function isPublicRoute(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return false;
  const [first, second] = segments;
  if (SUPPORTED_LANGS.includes(first)) {
    return PUBLIC_PATHS.has(`/${second ?? ''}`);
  }
  return PUBLIC_PATHS.has(`/${first}`);
}

function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];

  // Local development environment
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    // Try to extract subdomain from the full URL
    const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
    if (fullUrlMatch && fullUrlMatch[1]) {
      return fullUrlMatch[1];
    }

    // Fallback to host header approach
    if (hostname.includes('.localhost')) {
      return hostname.split('.')[0];
    }

    return null;
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(':')[0];

  // Handle preview deployment URLs (tenant---branch-name.vercel.app)
  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('---');
    return parts.length > 0 ? parts[0] : null;
  }

  // Regular subdomain detection
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  return isSubdomain ? hostname.replace(`.${rootDomainFormatted}`, '') : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const subdomain = extractSubdomain(request);

  if (subdomain) {
    // Block access to admin page from subdomains
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // For the root path on a subdomain, rewrite to the subdomain page
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(`/s/${subdomain}`, request.url));
    }
  }

  if (!isPublicRoute(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const loginPath = resolveLocaleRedirect(pathname);
      const url = new URL(loginPath, request.url);
      url.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }

    const roles = normalizeRoles((token.roles as RoleName[] | undefined) ?? []);
    const hasAccess = RBAC_RULES.every(({ pattern, requiredRoles }) => {
      if (!pattern.test(pathname)) return true;
      return hasAnyRole(roles, requiredRoles);
    });

    if (!hasAccess) {
      const loginPath = resolveLocaleRedirect(pathname);
      const url = new URL(loginPath, request.url);
      url.searchParams.set('error', 'AccessDenied');
      url.searchParams.set('callbackUrl', '/');
      return NextResponse.redirect(url);
    }
  }

  // On the root domain, allow normal access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|[\\w-]+\\.\\w+).*)'
  ]
};
