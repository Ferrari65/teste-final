// src/contexts/AuthContext.tsx - VERSÃO CORRIGIDA SEM ANY
'use client';

import { createContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import axios, { AxiosError, AxiosResponse } from 'axios';

// ===== INTERFACES =====
interface LoginResponse {
  id: string;
  token: string;
}

interface User {
  id: string;
  email: string;
  role: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthError {
  type: 'validation' | 'network' | 'unauthorized' | 'server' | 'unknown';
  message: string;
  statusCode?: number;
}

interface AuthContextData {
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
  user: User | null;
  error: AuthError | null;
  clearError: () => void;
  isInitialized: boolean;
  refreshAuth: () => Promise<void>;
}

// ===== TIPOS AUXILIARES =====
interface JWTPayload {
  sub?: string;
  email?: string;
  role: string;
  exp: number;
  iat?: number;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

// ===== CONFIGURAÇÕES =====
const AUTH_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  requestTimeout: 10000,
  tokenCookieName: 'nextauth.token',
  tokenLocalStorageKey: 'nextauth.token',
  secretariaIdKey: 'secretaria_id',
  maxAge: 604800,
  refreshInterval: 300000, // 5 minutos para verificar token
} as const;

const LOGIN_ENDPOINTS = [
  '/secretaria/auth/login',
  '/professor/auth/login', 
  '/aluno/login'
] as const;

const DASHBOARD_ROUTES = {
  ROLE_SECRETARIA: '/secretaria/alunos',
  ROLE_PROFESSOR: '/professor/home',
  ROLE_ALUNO: '/aluno/home',
} as const;

// ===== AXIOS INSTANCE =====
const api = axios.create({
  baseURL: AUTH_CONFIG.baseURL,
  timeout: AUTH_CONFIG.requestTimeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ===== HELPER FUNCTIONS =====
function isAxiosError(error: unknown): error is AxiosError {
  return error !== null && 
         typeof error === 'object' && 
         'isAxiosError' in error;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Erro desconhecido';
}

// ===== TOKEN MANAGER =====
const TokenManager = {
  save: (token: string, secretariaId?: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      const expires = new Date(Date.now() + AUTH_CONFIG.maxAge * 1000).toUTCString();
      const isSecure = window.location.protocol === 'https:';
      
      document.cookie = `${AUTH_CONFIG.tokenCookieName}=${token}; path=/; expires=${expires}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
      
      localStorage.setItem(AUTH_CONFIG.tokenLocalStorageKey, token);
      
      if (secretariaId) {
        localStorage.setItem(AUTH_CONFIG.secretariaIdKey, secretariaId);
      }
      
      console.log('🔐 Token salvo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar token:', getErrorMessage(error));
    }
  },

  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      // Priorizar cookie
      const cookieMatch = document.cookie.match(new RegExp(`${AUTH_CONFIG.tokenCookieName}=([^;]+)`));
      if (cookieMatch?.[1]) {
        console.log('🔐 Token obtido do cookie');
        return cookieMatch[1];
      }
      
      // Fallback para localStorage
      const localToken = localStorage.getItem(AUTH_CONFIG.tokenLocalStorageKey);
      if (localToken) {
        console.log('🔐 Token obtido do localStorage');
        return localToken;
      }
      
      console.log('🔐 Nenhum token encontrado');
      return null;
    } catch (error) {
      console.error('❌ Erro ao obter token:', getErrorMessage(error));
      return null;
    }
  },

  remove: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      document.cookie = `${AUTH_CONFIG.tokenCookieName}=; path=/; max-age=0`;
      localStorage.removeItem(AUTH_CONFIG.tokenLocalStorageKey);
      localStorage.removeItem(AUTH_CONFIG.secretariaIdKey);
      console.log('🔐 Token removido');
    } catch (error) {
      console.error('❌ Erro ao remover token:', getErrorMessage(error));
    }
  },

  getSecretariaId: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(AUTH_CONFIG.secretariaIdKey);
    } catch {
      return null;
    }
  },

  isValid: (token: string): boolean => {
    try {
      const payload = jwtDecode<JWTPayload>(token);
      const isExpired = payload.exp <= Date.now() / 1000;
      const hasRole = Boolean(payload.role);
      
      console.log('🔐 Validação do token:', {
        expired: isExpired,
        hasRole,
        expiresAt: new Date(payload.exp * 1000).toLocaleString()
      });
      
      return !isExpired && hasRole;
    } catch (error) {
      console.error('❌ Token inválido:', getErrorMessage(error));
      return false;
    }
  }
};

// ===== ERROR HANDLERS =====
const createError = (type: AuthError['type'], message: string, statusCode?: number): AuthError => ({
  type, message, statusCode
});

const handleAxiosError = (error: AxiosError<ApiErrorResponse>): AuthError => {
  console.error('🚫 Axios Error:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });

  if (error.response) {
    const status = error.response.status;
    const serverMessage = error.response.data?.message;
    
    switch (status) {
      case 400:
        return createError('validation', serverMessage || 'Dados inválidos fornecidos.', status);
      case 401:
        return createError('unauthorized', 'Email ou senha incorretos.', status);
      case 403:
        return createError('unauthorized', 'Sem permissão para acessar.', status);
      case 404:
        return createError('server', 'Serviço não encontrado.', status);
      case 500:
        return createError('server', 'Erro interno do servidor.', status);
      default:
        return createError('server', serverMessage || 'Erro no servidor.', status);
    }
  }
  
  if (error.request) {
    return createError('network', 'Erro de conexão. Verifique sua internet.');
  }
  
  return createError('unknown', error.message || 'Erro desconhecido.');
};

// ===== CONTEXT =====
export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // ===== MEMOIZED FUNCTIONS =====
  const clearError = useCallback(() => setError(null), []);

  const getRedirectPath = useCallback((role: string): string => {
    return DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES] || '/login';
  }, []);

  const processToken = useCallback((token: string): User | null => {
    try {
      if (!TokenManager.isValid(token)) {
        console.log('🔐 Token inválido ou expirado');
        return null;
      }

      const payload = jwtDecode<JWTPayload>(token);

      let userId = '';
      if (payload.role === 'ROLE_SECRETARIA') {
        userId = TokenManager.getSecretariaId() || payload.sub || '';
      } else {
        userId = payload.sub || '';
      }

      const userData = {
        email: payload.email || payload.sub || '',
        role: payload.role,
        id: userId
      };

      console.log('✅ Token processado:', userData);
      return userData;
    } catch (error) {
      console.error('❌ Erro ao processar token:', getErrorMessage(error));
      return null;
    }
  }, []);

  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      const token = TokenManager.get();
      
      if (!token) {
        console.log('🔐 Nenhum token para refresh');
        setUser(null);
        return;
      }

      if (!TokenManager.isValid(token)) {
        console.log('🔐 Token inválido no refresh');
        TokenManager.remove();
        setUser(null);
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          router.push('/login');
        }
        return;
      }

      const userData = processToken(token);
      if (userData) {
        setUser(userData);
        console.log('✅ Auth refreshed');
      } else {
        console.log('❌ Falha no refresh');
        TokenManager.remove();
        setUser(null);
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('❌ Erro no refresh:', getErrorMessage(error));
      TokenManager.remove();
      setUser(null);
    }
  }, [processToken, router]);

  const attemptLogin = useCallback(async (credentials: LoginCredentials): Promise<AxiosResponse<LoginResponse>> => {
    const errors: AxiosError[] = [];
    
    for (const endpoint of LOGIN_ENDPOINTS) {
      try {
        console.log(`🔄 Tentando login em: ${endpoint}`);
        const response = await api.post<LoginResponse>(endpoint, {
          email: credentials.email,
          senha: credentials.password
        });
        
        console.log(`✅ Login bem-sucedido em: ${endpoint}`);
        return response;
      } catch (error: unknown) {
        if (isAxiosError(error)) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          errors.push(axiosError);
          
          console.log(`❌ Falha em ${endpoint}:`, axiosError.response?.status);
          
          // Se é erro de credenciais, não tenta outros endpoints
          if (axiosError.response?.status === 401 || axiosError.response?.status === 400) {
            throw handleAxiosError(axiosError);
          }
        } else {
          console.error(`❌ Erro não-axios em ${endpoint}:`, getErrorMessage(error));
        }
      }
    }
    
    throw createError('server', 'Nenhum servidor disponível.');
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Iniciando login...');
      TokenManager.remove();
      
      const response = await attemptLogin(credentials);
      const data = response.data;
      
      if (!data.token || !data.id) {
        throw createError('server', 'Resposta inválida do servidor');
      }

      const userData = processToken(data.token);
      if (!userData) {
        throw createError('server', 'Token inválido recebido');
      }

      TokenManager.save(data.token, userData.role === 'ROLE_SECRETARIA' ? data.id : undefined);
      setUser({ ...userData, id: data.id });
      
      const redirectPath = getRedirectPath(userData.role);
      console.log(`✅ Login completo, redirecionando para: ${redirectPath}`);
      router.push(redirectPath);
      
    } catch (error: unknown) {
      console.error('❌ Erro no signIn:', error);
      
      if (isAxiosError(error)) {
        setError(handleAxiosError(error as AxiosError<ApiErrorResponse>));
      } else if (error && typeof error === 'object' && 'type' in error) {
        setError(error as AuthError);
      } else {
        setError(createError('unknown', getErrorMessage(error)));
      }
      
      TokenManager.remove();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [attemptLogin, processToken, getRedirectPath, router]);

  const signOut = useCallback((): void => {
    console.log('🔄 Fazendo logout...');
    setUser(null);
    setError(null);
    TokenManager.remove();
    router.push('/login');
  }, [router]);

  // ===== INITIALIZATION EFFECT =====
  useEffect(() => {
    const initializeAuth = async (): Promise<void> => {
      try {
        console.log('🔄 Inicializando autenticação...');
        await refreshAuth();
      } catch (error) {
        console.error('❌ Erro na inicialização:', getErrorMessage(error));
        TokenManager.remove();
        setUser(null);
      } finally {
        setIsInitialized(true);
        console.log('✅ Autenticação inicializada');
      }
    };

    initializeAuth();
  }, [refreshAuth]);

  // ===== PERIODIC TOKEN CHECK =====
  useEffect(() => {
    if (!isInitialized || !user) return;

    const interval = setInterval(() => {
      console.log('🔄 Verificação periódica do token...');
      refreshAuth();
    }, AUTH_CONFIG.refreshInterval);

    return () => clearInterval(interval);
  }, [isInitialized, user, refreshAuth]);

  // ===== MEMOIZED CONTEXT VALUE =====
  const contextValue = useMemo((): AuthContextData => ({
    signIn,
    signOut,
    isLoading,
    user,
    error,
    clearError,
    isInitialized,
    refreshAuth
  }), [signIn, signOut, isLoading, user, error, clearError, isInitialized, refreshAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}