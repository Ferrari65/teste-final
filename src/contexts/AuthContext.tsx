// src/contexts/AuthContext.tsx - VERSÃO OTIMIZADA
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
}

// ===== CONFIGURAÇÕES =====
const AUTH_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  requestTimeout: 10000,
  tokenCookieName: 'nextauth.token',
  tokenLocalStorageKey: 'nextauth.token',
  secretariaIdKey: 'secretaria_id',
  maxAge: 604800,
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

// ===== AXIOS INSTANCE OTIMIZADA =====
const api = axios.create({
  baseURL: AUTH_CONFIG.baseURL,
  timeout: AUTH_CONFIG.requestTimeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ===== UTILITY FUNCTIONS MEMOIZADAS =====
const TokenManager = {
  save: (token: string, secretariaId?: string): void => {
    if (typeof window === 'undefined') return;
    
    const expires = new Date(Date.now() + AUTH_CONFIG.maxAge * 1000).toUTCString();
    document.cookie = `${AUTH_CONFIG.tokenCookieName}=${token}; path=/; expires=${expires}; SameSite=Lax`;
    localStorage.setItem(AUTH_CONFIG.tokenLocalStorageKey, token);
    
    if (secretariaId) {
      localStorage.setItem(AUTH_CONFIG.secretariaIdKey, secretariaId);
    }
  },

  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const match = document.cookie.match(new RegExp(`${AUTH_CONFIG.tokenCookieName}=([^;]+)`));
    return match?.[1] || localStorage.getItem(AUTH_CONFIG.tokenLocalStorageKey);
  },

  remove: (): void => {
    if (typeof window === 'undefined') return;
    
    document.cookie = `${AUTH_CONFIG.tokenCookieName}=; path=/; max-age=0`;
    localStorage.removeItem(AUTH_CONFIG.tokenLocalStorageKey);
    localStorage.removeItem(AUTH_CONFIG.secretariaIdKey);
  },

  getSecretariaId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_CONFIG.secretariaIdKey);
  }
};

const createError = (type: AuthError['type'], message: string, statusCode?: number): AuthError => ({
  type, message, statusCode
});

const handleAxiosError = (error: AxiosError): AuthError => {
  if (error.response) {
    const status = error.response.status;
    return createError(
      'unauthorized', 
      status === 401 ? 'Email ou senha incorretos.' : 'Erro no servidor.',
      status
    );
  }
  
  if (error.request) {
    return createError('network', 'Erro de conexão. Verifique sua internet.');
  }
  
  return createError('unknown', error.message);
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
      const payload = jwtDecode<{
        sub?: string;
        email?: string;
        role: string;
        exp: number;
      }>(token);

      if (!payload.role || payload.exp <= Date.now() / 1000) {
        return null;
      }

      let userId = '';
      if (payload.role === 'ROLE_SECRETARIA') {
        userId = TokenManager.getSecretariaId() || payload.sub || '';
      } else {
        userId = payload.sub || '';
      }

      return {
        email: payload.email || payload.sub || '',
        role: payload.role,
        id: userId
      };
    } catch {
      return null;
    }
  }, []);

  const attemptLogin = useCallback(async (credentials: LoginCredentials): Promise<AxiosResponse> => {
    const errors: AxiosError[] = [];
    
    for (const endpoint of LOGIN_ENDPOINTS) {
      try {
        const response = await api.post(endpoint, {
          email: credentials.email,
          senha: credentials.password
        });
        return response;
      } catch (error) {
        const axiosError = error as AxiosError;
        errors.push(axiosError);
        
        if (axiosError.response?.status === 401 || axiosError.response?.status === 400) {
          throw handleAxiosError(axiosError);
        }
      }
    }
    
    throw createError('server', 'Nenhum servidor disponível.');
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      TokenManager.remove();
      
      const response = await attemptLogin(credentials);
      const data = response.data as LoginResponse;
      
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
      router.push(redirectPath);
      
    } catch (authError) {
      setError(authError as AuthError);
      TokenManager.remove();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [attemptLogin, processToken, getRedirectPath, router]);

  const signOut = useCallback((): void => {
    setUser(null);
    setError(null);
    TokenManager.remove();
    router.push('/login');
  }, [router]);

  // ===== INITIALIZATION EFFECT =====
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = TokenManager.get();
        
        if (token) {
          const userData = processToken(token);
          if (userData) {
            setUser(userData);
          } else {
            TokenManager.remove();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        TokenManager.remove();
        setUser(null);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [processToken]);

  // ===== MEMOIZED CONTEXT VALUE =====
  const contextValue = useMemo((): AuthContextData => ({
    signIn,
    signOut,
    isLoading,
    user,
    error,
    clearError,
    isInitialized
  }), [signIn, signOut, isLoading, user, error, clearError, isInitialized]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}