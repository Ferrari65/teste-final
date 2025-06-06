
import { NextResponse, NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// ===== CONFIGURAÇÕES =====
const AUTH_CONFIG = {
  tokenCookieName: 'nextauth.token',
  publicPaths: ['/login', '/redefinir'],
  protectedRoutes: {
    '/secretaria': 'ROLE_SECRETARIA',
    '/professor': 'ROLE_PROFESSOR', 
    '/aluno': 'ROLE_ALUNO'
  },
  dashboardRoutes: {
    ROLE_SECRETARIA: '/secretaria/alunos',
    ROLE_PROFESSOR: '/professor/home',
    ROLE_ALUNO: '/aluno/home',
  }
} as const;

// ===== INTERFACES =====
interface JWTPayload {
  role: string;
  exp: number;
  sub?: string;
}

// ===== UTILITY FUNCTIONS =====
function shouldSkipMiddleware(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    /\.(png|jpe?g|svg|gif|ico|css|js|woff2?|ttf|eot)$/i.test(pathname)
  );
}

function isPublicPath(pathname: string): boolean {
  return AUTH_CONFIG.publicPaths.includes(pathname);
}

function getTokenFromRequest(request: NextRequest): string | null {
  // Primeiro tenta do cookie
  const tokenFromCookie = request.cookies.get(AUTH_CONFIG.tokenCookieName)?.value;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  return null;
}

function isTokenValid(token: string): { valid: boolean; payload?: JWTPayload } {
  try {
    const payload = jwtDecode<JWTPayload>(token);
    
    if (payload.exp <= Date.now() / 1000) {
      return { valid: false };
    }
    
    if (!payload.role) {
      return { valid: false };
    }
    
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

function hasPermissionForRoute(userRole: string, pathname: string): boolean {
  for (const [routePrefix, requiredRole] of Object.entries(AUTH_CONFIG.protectedRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      return userRole === requiredRole;
    }
  }
  return true; 
}

function getDashboardRoute(role: string): string {
  return AUTH_CONFIG.dashboardRoutes[role as keyof typeof AUTH_CONFIG.dashboardRoutes] || '/login';
}

// ===== MIDDLEWARE PRINCIPAL =====
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;


  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }


  const token = getTokenFromRequest(request);
  
  const { valid: isTokenValidResult, payload } = token ? isTokenValid(token) : { valid: false };


  if (!isTokenValidResult || !payload) {
    
    if (!isPublicPath(pathname)) {
      const redirectUrl = new URL('/login', request.url);
      
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
   
    return NextResponse.next();
  }

  // ===== USUÁRIO AUTENTICADO =====
  
  if (pathname === '/login') {
    const dashboardRoute = getDashboardRoute(payload.role);
    return NextResponse.redirect(new URL(dashboardRoute, request.url));
  }

  if (isPublicPath(pathname) && pathname !== '/login') {
    const dashboardRoute = getDashboardRoute(payload.role);
    return NextResponse.redirect(new URL(dashboardRoute, request.url));
  }

  if (!hasPermissionForRoute(payload.role, pathname)) {
    
    const dashboardRoute = getDashboardRoute(payload.role);
    return NextResponse.redirect(new URL(dashboardRoute, request.url));
  }

 
  return NextResponse.next();
}

// ===== CONFIGURAÇÃO DO MATCHER =====
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};