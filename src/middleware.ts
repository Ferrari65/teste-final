// src/middleware.ts - VERSÃO CORRIGIDA PARA ELIMINAR PROBLEMAS DE PERMISSÃO

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
  iat?: number;
}

// ===== UTILITY FUNCTIONS =====
function shouldSkipMiddleware(pathname: string): boolean {
  const skipPatterns = [
    /^\/_next/,
    /^\/api/,
    /^\/favicon/,
    /\.(png|jpe?g|svg|gif|ico|css|js|woff2?|ttf|eot|webp)$/i
  ];
  
  return skipPatterns.some(pattern => pattern.test(pathname));
}

function isPublicPath(pathname: string): boolean {
  return AUTH_CONFIG.publicPaths.includes(pathname);
}

function getTokenFromRequest(request: NextRequest): string | null {
  try {
    // ✅ PRIORIZAR COOKIE
    const tokenFromCookie = request.cookies.get(AUTH_CONFIG.tokenCookieName)?.value;
    if (tokenFromCookie && tokenFromCookie.trim() !== '') {
      console.log('🔐 [MIDDLEWARE] Token obtido do cookie');
      return tokenFromCookie;
    }

    console.log('🔐 [MIDDLEWARE] Nenhum token encontrado');
    return null;
  } catch (error) {
    console.error('❌ [MIDDLEWARE] Erro ao obter token:', error);
    return null;
  }
}

function isTokenValid(token: string): { valid: boolean; payload?: JWTPayload; reason?: string } {
  try {
    if (!token || token.trim() === '') {
      return { valid: false, reason: 'Token vazio' };
    }

    const payload = jwtDecode<JWTPayload>(token);
    
    // ✅ VERIFICAR EXPIRAÇÃO
    const now = Math.floor(Date.now() / 1000);
    const timeToExpire = payload.exp - now;
    
    if (payload.exp <= now) {
      console.log('🔐 [MIDDLEWARE] Token expirado:', {
        exp: payload.exp,
        now,
        expired: timeToExpire
      });
      return { valid: false, reason: 'Token expirado' };
    }
    
    // ✅ VERIFICAR ROLE
    if (!payload.role || payload.role.trim() === '') {
      console.log('🔐 [MIDDLEWARE] Token sem role válida');
      return { valid: false, reason: 'Role ausente' };
    }
    
    // ✅ LOG DE SUCESSO
    console.log('✅ [MIDDLEWARE] Token válido:', {
      role: payload.role,
      expiresIn: `${Math.floor(timeToExpire / 60)} minutos`,
      sub: payload.sub
    });
    
    return { valid: true, payload };
  } catch (error) {
    console.error('❌ [MIDDLEWARE] Erro ao decodificar token:', error);
    return { valid: false, reason: 'Token malformado' };
  }
}

function hasPermissionForRoute(userRole: string, pathname: string): boolean {
  for (const [routePrefix, requiredRole] of Object.entries(AUTH_CONFIG.protectedRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      const hasPermission = userRole === requiredRole;
      console.log(`🔐 [MIDDLEWARE] Verificação de permissão:`, {
        pathname,
        routePrefix,
        userRole,
        requiredRole,
        hasPermission
      });
      return hasPermission;
    }
  }
  
  // ✅ SE NÃO É ROTA PROTEGIDA, PERMITIR
  console.log('🔐 [MIDDLEWARE] Rota não protegida:', pathname);
  return true; 
}

function getDashboardRoute(role: string): string {
  const route = AUTH_CONFIG.dashboardRoutes[role as keyof typeof AUTH_CONFIG.dashboardRoutes];
  console.log(`🔐 [MIDDLEWARE] Dashboard route para ${role}:`, route);
  return route || '/login';
}

function createRedirectResponse(request: NextRequest, path: string, reason?: string): NextResponse {
  const redirectUrl = new URL(path, request.url);
  console.log(`🔄 [MIDDLEWARE] Redirecionando para ${path}${reason ? ` (${reason})` : ''}`);
  return NextResponse.redirect(redirectUrl);
}

// ===== MIDDLEWARE PRINCIPAL =====
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`🔍 [MIDDLEWARE] Processando: ${pathname}`);

  // ✅ SKIP ARQUIVOS ESTÁTICOS E APIs
  if (shouldSkipMiddleware(pathname)) {
    console.log(`⏭️ [MIDDLEWARE] Pulando: ${pathname}`);
    return NextResponse.next();
  }

  // ✅ REDIRECIONAR RAIZ PARA LOGIN
  if (pathname === '/') {
    return createRedirectResponse(request, '/login', 'raiz para login');
  }

  // ✅ OBTER E VALIDAR TOKEN
  const token = getTokenFromRequest(request);
  const { valid: isTokenValidResult, payload, reason } = token ? isTokenValid(token) : { valid: false, reason: 'Sem token' };

  // ===== USUÁRIO NÃO AUTENTICADO =====
  if (!isTokenValidResult || !payload) {
    console.log(`🚫 [MIDDLEWARE] Token inválido: ${reason}`);
    
    // ✅ SE ESTÁ TENTANDO ACESSAR ÁREA PROTEGIDA, REDIRECIONAR PARA LOGIN
    if (!isPublicPath(pathname)) {
      const redirectUrl = new URL('/login', request.url);
      
      // ✅ PRESERVAR DESTINO ORIGINAL PARA REDIRECT PÓS-LOGIN
      if (pathname !== '/login') {
        redirectUrl.searchParams.set('redirect', pathname);
      }
      
      return NextResponse.redirect(redirectUrl);
    }
    
    // ✅ SE ESTÁ EM PÁGINA PÚBLICA, PERMITIR
    console.log(`✅ [MIDDLEWARE] Permitindo acesso público: ${pathname}`);
    return NextResponse.next();
  }

  // ===== USUÁRIO AUTENTICADO =====
  console.log(`✅ [MIDDLEWARE] Usuário autenticado:`, {
    role: payload.role,
    pathname
  });
  
  // ✅ SE USUÁRIO LOGADO TENTA ACESSAR LOGIN, REDIRECIONAR PARA DASHBOARD
  if (pathname === '/login') {
    const dashboardRoute = getDashboardRoute(payload.role);
    return createRedirectResponse(request, dashboardRoute, 'usuário já logado');
  }

  // ✅ SE USUÁRIO LOGADO TENTA ACESSAR OUTRAS PÁGINAS PÚBLICAS, REDIRECIONAR PARA DASHBOARD
  if (isPublicPath(pathname) && pathname !== '/login') {
    const dashboardRoute = getDashboardRoute(payload.role);
    return createRedirectResponse(request, dashboardRoute, 'redirecionamento de página pública');
  }

  // ✅ VERIFICAR PERMISSÃO PARA ROTA PROTEGIDA
  if (!hasPermissionForRoute(payload.role, pathname)) {
    console.log(`🚫 [MIDDLEWARE] Sem permissão para: ${pathname}`);
    const dashboardRoute = getDashboardRoute(payload.role);
    return createRedirectResponse(request, dashboardRoute, 'sem permissão');
  }

  // ✅ TUDO OK, PERMITIR ACESSO
  console.log(`✅ [MIDDLEWARE] Acesso permitido: ${pathname}`);
  
  // ✅ ADICIONAR HEADERS DE CONTROLE (OPCIONAL)
  const response = NextResponse.next();
  response.headers.set('x-user-role', payload.role);
  response.headers.set('x-pathname', pathname);
  
  return response;
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
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?|ttf|eot)$).*)',
  ],
};