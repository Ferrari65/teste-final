// src/hooks/secretaria/turma/useTurmaList.ts - HOOK PARA LISTAR TURMAS

import { useState, useContext, useCallback, useEffect } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { getAPIClient, handleApiError } from '@/services/api';
import type { TurmaResponse } from '@/schemas';

// ===== INTERFACES =====
export interface FiltrosTurma {
  nome?: string;
  curso?: string;
  ano?: string;
  turno?: 'DIURNO' | 'NOTURNO';
  page?: number;
  size?: number;
}

export interface TurmaListResponse {
  turmas: TurmaResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface UseTurmaListReturn {
  turmas: TurmaResponse[];
  loading: boolean;
  error: string | null;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  fetchTurmas: (filtros?: FiltrosTurma) => Promise<void>;
  refetch: () => void;
  clearError: () => void;
}

// ===== HOOK PRINCIPAL =====
export const useTurmaList = (
  filtrosIniciais: FiltrosTurma = {}
): UseTurmaListReturn => {
  const [turmas, setTurmas] = useState<TurmaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [ultimosFiltros, setUltimosFiltros] = useState<FiltrosTurma>(filtrosIniciais);
  
  const { user } = useContext(AuthContext);

  const clearError = useCallback(() => setError(null), []);

  // ===== FUNÇÃO PARA BUSCAR TURMAS =====
  const fetchTurmas = useCallback(async (filtros: FiltrosTurma = {}): Promise<void> => {
    if (!user?.id) {
      setError('ID da secretaria não encontrado. Faça login novamente.');
      return;
    }

    setLoading(true);
    setError(null);
    setUltimosFiltros(filtros);

    try {
      const api = getAPIClient();
      
      // ✅ CONSTRUIR QUERY PARAMS
      const queryParams = new URLSearchParams();
      
      if (filtros.nome?.trim()) {
        queryParams.append('nome', filtros.nome.trim());
      }
      
      if (filtros.curso?.trim()) {
        queryParams.append('idCurso', filtros.curso.trim());
      }
      
      if (filtros.ano?.trim()) {
        queryParams.append('ano', filtros.ano.trim());
      }
      
      if (filtros.turno) {
        queryParams.append('turno', filtros.turno);
      }
      
      // Paginação
      queryParams.append('page', String(filtros.page || 0));
      queryParams.append('size', String(filtros.size || 10));

      // ✅ ENDPOINT QUE VOCÊ PRECISA CRIAR NO BACKEND
      // Exemplo: GET /turma/listar/{id_secretaria}?nome=...&idCurso=...&ano=...&turno=...&page=0&size=10
      const queryString = queryParams.toString();
      const endpoint = `/turma/listar/${user.id}${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<TurmaListResponse>(endpoint);
      
      if (response.data) {
        // ✅ SE O BACKEND RETORNA PAGINAÇÃO ESTRUTURADA
        if ('turmas' in response.data && Array.isArray(response.data.turmas)) {
          setTurmas(response.data.turmas);
          setTotalElements(response.data.totalElements || 0);
          setTotalPages(response.data.totalPages || 0);
          setCurrentPage(response.data.currentPage || 0);
        } 
        // ✅ SE O BACKEND RETORNA ARRAY DIRETO
        else if (Array.isArray(response.data)) {
          setTurmas(response.data);
          setTotalElements(response.data.length);
          setTotalPages(1);
          setCurrentPage(0);
        } 
        // ✅ FALLBACK
        else {
          setTurmas([]);
          setTotalElements(0);
          setTotalPages(0);
          setCurrentPage(0);
        }
      } else {
        setTurmas([]);
        setTotalElements(0);
        setTotalPages(0);
        setCurrentPage(0);
      }
      
    } catch (err: unknown) {
      const { message, status } = handleApiError(err, 'FetchTurmas');
      
      // ✅ TRATAMENTO ESPECÍFICO DE ERROS
      switch (status) {
        case 404:
          setError('Nenhuma turma encontrada com os filtros especificados.');
          break;
        case 403:
          setError('Sem permissão para listar turmas.');
          break;
        default:
          setError(message);
      }
      
      setTurmas([]);
      setTotalElements(0);
      setTotalPages(0);
      setCurrentPage(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ===== FUNÇÃO PARA REFETCH =====
  const refetch = useCallback(() => {
    fetchTurmas(ultimosFiltros);
  }, [fetchTurmas, ultimosFiltros]);

  // ===== BUSCAR AUTOMATICAMENTE NA MONTAGEM =====
  useEffect(() => {
    if (user?.id) {
      fetchTurmas(filtrosIniciais);
    }
  }, [user?.id]); // Não incluir fetchTurmas aqui para evitar loop

  return {
    turmas,
    loading,
    error,
    totalElements,
    totalPages,
    currentPage,
    fetchTurmas,
    refetch,
    clearError,
  };
};

// ===== HOOK SIMPLIFICADO PARA BUSCA RÁPIDA =====
export const useTurmaQuickSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resultados, setResultados] = useState<TurmaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useContext(AuthContext);

  const buscarRapido = useCallback(async (termo: string) => {
    if (!termo.trim() || !user?.id) {
      setResultados([]);
      return;
    }

    setLoading(true);
    
    try {
      const api = getAPIClient();
      
      // ✅ ENDPOINT PARA BUSCA RÁPIDA (VOCÊ PODE CRIAR)
      // Exemplo: GET /turma/buscar-rapido/{id_secretaria}?q=termo
      const response = await api.get(`/turma/buscar-rapido/${user.id}?q=${encodeURIComponent(termo)}`);
      
      setResultados(response.data || []);
    } catch (error) {
      setResultados([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ DEBOUNCE PARA BUSCA EM TEMPO REAL
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarRapido(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, buscarRapido]);

  return {
    searchTerm,
    setSearchTerm,
    resultados,
    loading,
    buscarRapido
  };
};

// ===== HOOKS DE AÇÕES COM TURMAS =====
export const useTurmaActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { user } = useContext(AuthContext);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  // ✅ DELETAR TURMA
  const deletarTurma = useCallback(async (turmaId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('ID da secretaria não encontrado.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getAPIClient();
      
      // ✅ ENDPOINT PARA DELETAR (VOCÊ PODE CRIAR)
      await api.delete(`/turma/deletar/${turmaId}`);
      
      setSuccessMessage('Turma excluída com sucesso!');
      return true;
    } catch (err) {
      const { message } = handleApiError(err, 'DeleteTurma');
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ✅ EDITAR TURMA
  const editarTurma = useCallback(async (
    turmaId: string, 
    dadosAtualizados: Partial<Pick<TurmaResponse, 'nome' | 'ano'>>
  ): Promise<boolean> => {
    if (!user?.id) {
      setError('ID da secretaria não encontrado.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getAPIClient();
      
      // ✅ ENDPOINT PARA EDITAR (VOCÊ PODE CRIAR)
      await api.put(`/turma/editar/${turmaId}`, dadosAtualizados);
      
      setSuccessMessage('Turma atualizada com sucesso!');
      return true;
    } catch (err) {
      const { message } = handleApiError(err, 'EditTurma');
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return {
    loading,
    error,
    successMessage,
    clearMessages,
    deletarTurma,
    editarTurma,
  };
};