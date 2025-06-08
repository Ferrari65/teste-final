// src/hooks/secretaria/turma/useTurmaSearch.ts
// HOOK SIMPLES PARA BUSCAR TURMAS POR NOME

import { useState, useContext, useCallback } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { getAPIClient, handleApiError } from '@/services/api';
import type { TurmaResponse } from '@/schemas';

// ===== INTERFACE SIMPLES - SÓ NOME =====
export interface FiltrosBusca {
  nome?: string; // Apenas busca por nome
}

export interface UseTurmaSearchReturn {
  // Estados
  filtros: FiltrosBusca;
  resultados: TurmaResponse[];
  loading: boolean;
  error: string | null;
  totalEncontradas: number;
  
  // Ações
  atualizarFiltro: (campo: keyof FiltrosBusca, valor: string) => void;
  buscar: () => Promise<void>;
  limparBusca: () => void;
  limparFiltros: () => void;
  clearError: () => void;
}

const FILTROS_INICIAIS: FiltrosBusca = {
  nome: ''
};

// ===== HOOK PRINCIPAL =====
export const useTurmaSearch = (): UseTurmaSearchReturn => {
  const [filtros, setFiltrosState] = useState<FiltrosBusca>(FILTROS_INICIAIS);
  const [resultados, setResultados] = useState<TurmaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalEncontradas, setTotalEncontradas] = useState(0);
  
  const { user } = useContext(AuthContext);

  // Limpar erro
  const clearError = useCallback(() => setError(null), []);

  // Atualizar um filtro
  const atualizarFiltro = useCallback((campo: keyof FiltrosBusca, valor: string) => {
    setFiltrosState(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  // Validar se tem filtro
  const validarFiltros = useCallback((filtros: FiltrosBusca): string | null => {
    if (!filtros.nome || filtros.nome.trim() === '') {
      return 'Digite o nome da turma para buscar';
    }

    if (filtros.nome.trim().length < 2) {
      return 'Nome deve ter pelo menos 2 caracteres';
    }

    return null; // Tudo OK
  }, []);

  // Buscar turmas
  const buscar = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setError('ID da secretaria não encontrado. Faça login novamente.');
      return;
    }

    // Validar filtros
    const erroValidacao = validarFiltros(filtros);
    if (erroValidacao) {
      setError(erroValidacao);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getAPIClient();
      
      // USAR ENDPOINT QUE EXISTE NO SEU BACKEND
      // GET /turma/{id_secretaria}/secretaria - busca todas as turmas
      const response = await api.get(`/turma/${user.id}/secretaria`);
      
      console.log('🔍 Resposta da busca:', response.data);
      
      let todasTurmas: TurmaResponse[] = [];
      
      // Processar resposta
      if (Array.isArray(response.data)) {
        todasTurmas = response.data;
      } else if (response.data && response.data.turmas) {
        todasTurmas = response.data.turmas;
      } else {
        todasTurmas = [];
      }

      // FILTRAR POR NOME NO FRONTEND
      const nomeBusca = filtros.nome!.trim().toLowerCase();
      const turmasFiltradas = todasTurmas.filter(turma => 
        turma.nome && turma.nome.toLowerCase().includes(nomeBusca)
      );

      setResultados(turmasFiltradas);
      setTotalEncontradas(turmasFiltradas.length);
      
      console.log(`✅ Encontradas ${turmasFiltradas.length} turmas com nome "${filtros.nome}"`);
      
    } catch (err: unknown) {
      const { message, status } = handleApiError(err, 'SearchTurmas');
      
      switch (status) {
        case 404:
          setError('Nenhuma turma encontrada');
          break;
        case 403:
          setError('Sem permissão para buscar turmas');
          break;
        default:
          setError(message);
      }
      
      setResultados([]);
      setTotalEncontradas(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filtros, validarFiltros]);

  // Limpar apenas os resultados
  const limparBusca = useCallback(() => {
    setResultados([]);
    setTotalEncontradas(0);
    setError(null);
  }, []);

  // Limpar tudo
  const limparFiltros = useCallback(() => {
    setFiltrosState(FILTROS_INICIAIS);
    limparBusca();
  }, [limparBusca]);

  return {
    filtros,
    resultados,
    loading,
    error,
    totalEncontradas,
    atualizarFiltro,
    buscar,
    limparBusca,
    limparFiltros,
    clearError,
  };
};