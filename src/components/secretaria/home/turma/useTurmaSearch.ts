// src/hooks/secretaria/turma/useTurmaSearch.ts
// Este arquivo substitui a funcionalidade de busca por ID

import { useState, useContext, useCallback } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { getAPIClient, handleApiError } from '@/services/api';
import type { TurmaResponse } from '@/schemas';

// ===== O QUE SÃO ESSES FILTROS? =====
// São os campos que o usuário pode preencher para buscar turmas
export interface FiltrosBusca {
  nome?: string;        // Nome da turma (ex: "Turma ADS 2024")
  curso?: string;       // ID do curso 
  ano?: string;         // Ano letivo (ex: "2024")
  turno?: 'DIURNO' | 'NOTURNO' | '';  // Turno da turma
}

// ===== O QUE VEM DO BACKEND =====
export interface ResultadoBusca {
  turmas: TurmaResponse[];
  totalEncontradas: number;
  tempoResposta?: number;
}

// ===== O QUE ESTE HOOK FAZ =====
// Ele permite buscar turmas usando filtros ao invés de apenas ID
export interface UseTurmaSearchReturn {
  // Estados (informações atuais)
  filtros: FiltrosBusca;              // Filtros que o usuário preencheu
  resultados: TurmaResponse[];        // Turmas encontradas
  loading: boolean;                   // Se está carregando
  error: string | null;               // Se deu erro
  totalEncontradas: number;           // Quantas turmas foram encontradas
  
  // Ações (coisas que o usuário pode fazer)
  setFiltros: (filtros: FiltrosBusca) => void;           // Definir todos os filtros de uma vez
  atualizarFiltro: (campo: keyof FiltrosBusca, valor: string) => void;  // Mudar apenas um filtro
  buscar: () => Promise<void>;                           // Fazer a busca
  limparBusca: () => void;                              // Limpar os resultados
  limparFiltros: () => void;                            // Limpar tudo
  clearError: () => void;                               // Limpar erro
}

// ===== FILTROS VAZIOS (PADRÃO) =====
const FILTROS_INICIAIS: FiltrosBusca = {
  nome: '',
  curso: '',
  ano: '',
  turno: ''
};

// ===== HOOK PRINCIPAL =====
export const useTurmaSearch = (): UseTurmaSearchReturn => {
  // Estados internos do hook
  const [filtros, setFiltrosState] = useState<FiltrosBusca>(FILTROS_INICIAIS);
  const [resultados, setResultados] = useState<TurmaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalEncontradas, setTotalEncontradas] = useState(0);
  
  // Pegar dados do usuário logado
  const { user } = useContext(AuthContext);

  // Função para limpar erro
  const clearError = useCallback(() => setError(null), []);

  // ===== ATUALIZAR FILTROS =====
  const setFiltros = useCallback((novosFiltros: FiltrosBusca) => {
    setFiltrosState(novosFiltros);
  }, []);

  // Atualizar apenas um campo do filtro
  const atualizarFiltro = useCallback((campo: keyof FiltrosBusca, valor: string) => {
    setFiltrosState(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  // ===== VALIDAR SE OS FILTROS ESTÃO CORRETOS =====
  const validarFiltros = useCallback((filtros: FiltrosBusca): string | null => {
    // Verificar se pelo menos um filtro foi preenchido
    const temFiltro = Object.values(filtros).some(valor => 
      valor && valor.toString().trim() !== ''
    );

    if (!temFiltro) {
      return 'Preencha pelo menos um filtro para buscar';
    }

    // Validar ano se preenchido
    if (filtros.ano && filtros.ano.trim() !== '') {
      if (!/^\d{4}$/.test(filtros.ano)) {
        return 'Ano deve ter 4 dígitos (ex: 2024)';
      }
      
      const ano = parseInt(filtros.ano);
      const anoAtual = new Date().getFullYear();
      if (ano < 2000 || ano > anoAtual + 5) {
        return `Ano deve ser entre 2000 e ${anoAtual + 5}`;
      }
    }

    // Validar turno se preenchido
    if (filtros.turno && !['DIURNO', 'NOTURNO'].includes(filtros.turno)) {
      return 'Turno deve ser DIURNO ou NOTURNO';
    }

    return null; // Tudo OK
  }, []);

  // ===== CRIAR A URL DE BUSCA =====
  const construirQueryParams = useCallback((filtros: FiltrosBusca): string => {
    const params = new URLSearchParams();

    if (filtros.nome?.trim()) {
      params.append('nome', filtros.nome.trim());
    }

    if (filtros.curso?.trim()) {
      params.append('idCurso', filtros.curso.trim());
    }

    if (filtros.ano?.trim()) {
      params.append('ano', filtros.ano.trim());
    }

    if (filtros.turno && filtros.turno !== '') {
      params.append('turno', filtros.turno);
    }

    return params.toString();
  }, []);

  // ===== FUNÇÃO PRINCIPAL DE BUSCA =====
  const buscar = useCallback(async (): Promise<void> => {
    // Verificar se o usuário está logado
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
    
    const inicioTempo = Date.now();

    try {
      const api = getAPIClient();
      const queryString = construirQueryParams(filtros);
      
      // Endpoint para busca com filtros
      // IMPORTANTE: Você precisa criar este endpoint no seu backend!
      const endpoint = `/turma/buscar/${user.id}${queryString ? `?${queryString}` : ''}`;
      
      console.log('🔍 Buscando turmas com filtros:', filtros);
      console.log('🔍 URL da busca:', endpoint);
      
      const response = await api.get<TurmaResponse[] | ResultadoBusca>(endpoint);
      
      let turmasEncontradas: TurmaResponse[] = [];
      let total = 0;
      
      // Processar resposta (pode vir de formas diferentes do backend)
      if (Array.isArray(response.data)) {
        // Se vier um array direto
        turmasEncontradas = response.data;
        total = response.data.length;
      } else if (response.data && 'turmas' in response.data) {
        // Se vier um objeto com propriedade "turmas"
        const resultado = response.data as ResultadoBusca;
        turmasEncontradas = resultado.turmas || [];
        total = resultado.totalEncontradas || turmasEncontradas.length;
      } else {
        // Se não vier nada
        turmasEncontradas = [];
        total = 0;
      }

      setResultados(turmasEncontradas);
      setTotalEncontradas(total);
      
      const tempoResposta = Date.now() - inicioTempo;
      console.log(`✅ Busca concluída: ${total} turma(s) em ${tempoResposta}ms`);
      
    } catch (err: unknown) {
      const { message, status } = handleApiError(err, 'SearchTurmas');
      
      // Tratar diferentes tipos de erro
      switch (status) {
        case 404:
          setError('Nenhuma turma encontrada com os filtros especificados');
          break;
        case 400:
          setError('Filtros inválidos. Verifique os dados informados');
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
  }, [user?.id, filtros, validarFiltros, construirQueryParams]);

  // ===== LIMPAR APENAS OS RESULTADOS =====
  const limparBusca = useCallback(() => {
    setResultados([]);
    setTotalEncontradas(0);
    setError(null);
  }, []);

  // ===== LIMPAR TUDO (FILTROS + RESULTADOS) =====
  const limparFiltros = useCallback(() => {
    setFiltrosState(FILTROS_INICIAIS);
    limparBusca();
  }, [limparBusca]);

  // Retornar tudo que o componente vai usar
  return {
    filtros,
    resultados,
    loading,
    error,
    totalEncontradas,
    setFiltros,
    atualizarFiltro,
    buscar,
    limparBusca,
    limparFiltros,
    clearError,
  };
};