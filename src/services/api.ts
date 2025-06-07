// src/services/api.ts - VERSÃO OTIMIZADA

import axios, { AxiosInstance, AxiosHeaders, AxiosError } from 'axios';
import { 
  API_CONFIG, 
  AUTH_CONFIG, 
  ERROR_MESSAGES,
  ENV
} from '@/config/app';

// ===== TOKEN MANAGER =====
function getToken(): string | null {
  if (ENV.isServer) return null;
  
  try {
    // ✅ PRIORIZAR COOKIE
    const cookieMatch = document.cookie.match(new RegExp(`${AUTH_CONFIG.tokenCookieName}=([^;]+)`));
    if (cookieMatch?.[1]) {
      console.log('🔐 [API] Token obtido do cookie');
      return cookieMatch[1];
    }
    
    // ✅ FALLBACK localStorage
    const localToken = localStorage.getItem(AUTH_CONFIG.tokenLocalStorageKey);
    if (localToken) {
      console.log('🔐 [API] Token obtido do localStorage');
      return localToken;
    }

    console.log('🔐 [API] Nenhum token encontrado');
    return null;
  } catch (error) {
    console.error('❌ [API] Erro ao obter token:', error);
    return null;
  }
}

function clearTokens(): void {
  if (ENV.isServer) return;
  
  try {
    console.log('🔐 [API] Limpando tokens...');
    
    // ✅ LIMPAR COOKIE
    document.cookie = `${AUTH_CONFIG.tokenCookieName}=; path=/; max-age=0`;
    
    // ✅ LIMPAR localStorage
    localStorage.removeItem(AUTH_CONFIG.tokenLocalStorageKey);
    localStorage.removeItem(AUTH_CONFIG.secretariaIdKey);
    
    console.log('✅ [API] Tokens limpos');
  } catch (error) {
    console.error('❌ [API] Erro crítico ao limpar tokens:', error);
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp <= now;
    
    if (isExpired) {
      console.log('🔐 [API] Token expirado:', {
        exp: payload.exp,
        now,
        timeExpired: now - payload.exp
      });
    }
    
    return isExpired;
  } catch {
    console.log('🔐 [API] Token malformado');
    return true;
  }
}

// ===== ERROR HANDLER MELHORADO =====
function getErrorMessage(error: AxiosError): string {
  console.log('🚫 [API] Erro detectado:', {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    url: error.config?.url,
    method: error.config?.method
  });

  if (error.response) {
    const { status, data } = error.response;
    const serverMessage = (data as any)?.message || (data as any)?.error;
    
    switch (status) {
      case 400:
        return serverMessage || 'Dados inválidos fornecidos.';
      case 401:
        console.log('🚫 [API] Erro 401 - Token inválido ou expirado');
        return ERROR_MESSAGES.INVALID_CREDENTIALS;
      case 403:
        console.log('🚫 [API] Erro 403 - Sem permissão');
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 404:
        return 'Recurso não encontrado no servidor.';
      case 422:
        return serverMessage || 'Dados inconsistentes ou já existem.';
      case 429:
        return 'Muitas tentativas. Aguarde alguns minutos.';
      case 500:
        console.log('🚫 [API] Erro 500 - Servidor');
        return ERROR_MESSAGES.SERVER_ERROR;
      case 502:
      case 503:
      case 504:
        return 'Serviço temporariamente indisponível.';
      default:
        return serverMessage || `Erro ${status}: ${error.response.statusText}`;
    }
  }
  
  if (error.request) {
    console.log('🚫 [API] Erro de rede');
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  console.log('🚫 [API] Erro desconhecido:', error.message);
  return error.message || ERROR_MESSAGES.UNKNOWN;
}

// ===== AXIOS INSTANCE =====
export function getAPIClient(): AxiosInstance {
  const api = axios.create({
    ...API_CONFIG,
    // ✅ TIMEOUT CONFIGURÁVEL
    timeout: API_CONFIG.timeout,
  });

  // ===== REQUEST INTERCEPTOR =====
  api.interceptors.request.use(
    (config) => {
      const currentToken = getToken();

      // ✅ ADICIONAR TOKEN SE DISPONÍVEL E VÁLIDO
      if (currentToken && !isTokenExpired(currentToken)) {
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        config.headers.set('Authorization', `Bearer ${currentToken}`);
        console.log('🔐 [API] Token adicionado à requisição');
      } else if (currentToken && isTokenExpired(currentToken)) {
        console.log('🔐 [API] Token expirado detectado, limpando...');
        clearTokens();
      }

      // ✅ LOG DA REQUISIÇÃO
      console.log('📤 [API] Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasAuth: !!config.headers?.Authorization
      });

      return config;
    },
    (error) => {
      console.error('❌ [API] Request Error:', error);
      return Promise.reject(error);
    }
  );

  // ===== RESPONSE INTERCEPTOR =====
  api.interceptors.response.use(
    (response) => {
      // ✅ LOG DE SUCESSO
      console.log('✅ [API] Response:', {
        status: response.status,
        url: response.config.url,
        method: response.config.method?.toUpperCase()
      });

      return response;
    },
    (error: AxiosError) => {
      const status = error.response?.status;
      const url = error.config?.url;

      console.error('❌ [API] Response Error:', {
        status,
        url,
        method: error.config?.method?.toUpperCase(),
        message: error.message
      });

      // ✅ TRATAMENTO ESPECÍFICO POR STATUS
      switch (status) {
        case 401:
          console.log('🚫 [API] 401 - Limpando tokens e redirecionando...');
          clearTokens();
          
          // ✅ REDIRECIONAR APENAS SE NÃO ESTIVER NA PÁGINA DE LOGIN
          if (!ENV.isServer && !window.location.pathname.includes('/login')) {
            const currentPath = window.location.pathname + window.location.search;
            const redirectParam = encodeURIComponent(currentPath);
            console.log(`🔄 [API] Redirecionando para login com redirect=${redirectParam}`);
            window.location.href = `/login?redirect=${redirectParam}`;
          }
          break;
          
        case 403:
          console.log('🚫 [API] 403 - Sem permissão para este recurso');
          break;
          
        case 500:
        case 502:
        case 503:
          console.log('🚫 [API] Erro de servidor:', status);
          break;

        case 404:
          console.log('🚫 [API] 404 - Recurso não encontrado:', url);
          break;
      }

      return Promise.reject(error);
    }
  );

  return api;
}

// ===== SINGLETON INSTANCE =====
export const api = getAPIClient();

// ===== UTILITY FUNCTIONS =====
export function isAuthenticated(): boolean {
  const token = getToken();
  return token !== null && !isTokenExpired(token);
}

export function logout(): void {
  console.log('🔄 [API] Fazendo logout manual...');
  clearTokens();
  if (!ENV.isServer) {
    window.location.href = '/login';
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (token && !isTokenExpired(token)) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

// ===== ERROR HANDLER PRINCIPAL =====
export function handleApiError(
  error: AxiosError | Error | unknown, 
  context?: string
): { message: string; status?: number } {
  console.log(`🚫 [API] Tratando erro${context ? ` em ${context}` : ''}:`, error);

  if (axios.isAxiosError(error)) {
    const message = getErrorMessage(error);
    const status = error.response?.status;
    
    // ✅ LOG ESTRUTURADO
    console.error(`❌ [API] ${context || 'API'} Error:`, {
      status,
      message,
      url: error.config?.url,
      method: error.config?.method
    });
    
    return { message, status };
  }
  
  // ✅ ERRO NÃO-AXIOS
  const message = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN;
  console.error(`❌ [API] ${context || 'Unknown'} Error:`, message);
  
  return { message };
}

// ===== FUNÇÕES DE VERIFICAÇÃO =====
export function checkAPIHealth(): Promise<boolean> {
  return api.get('/health')
    .then(() => {
      console.log('✅ [API] Servidor saudável');
      return true;
    })
    .catch(() => {
      console.log('❌ [API] Servidor indisponível');
      return false;
    });
}

export function refreshToken(): Promise<void> {
  // ✅ IMPLEMENTAR SE O BACKEND SUPORTAR REFRESH TOKEN
  return Promise.resolve();
}

// ===== EXPORT LEGACY =====
export { getErrorMessage };