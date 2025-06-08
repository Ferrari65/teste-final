// src/hooks/secretaria/turma/useTurmaSearchSmart.ts
// HOOK PARA BUSCA INTELIGENTE POR NOME

import { useState, useCallback } from 'react';
import { getAPIClient, handleApiError } from '@/services/api';
import type { TurmaResponse } from '@/schemas';

// ===== INTERFACES =====
export interface TurmaEncontrada extends TurmaResponse {
  nomeCurso?: string;
  quantidadeAlunos: number;
  relevancia: number; // Para ordenar por relevância da busca
}

export interface UseTurmaSearchSmartReturn {
  // Estados
  termoBusca: string;
  resultados: TurmaEncontrada[];
  loading: boolean;
  error: string | null;
  jaFezBusca: boolean;
  
  // Ações
  setTermoBusca: (termo: string) => void;
  buscarPorNome: (nome: string) => Promise<void>;
  limparBusca: () => void;
  clearError: () => void;
}

// ===== HELPER FUNCTIONS =====

// Função para calcular relevância da busca
function calcularRelevancia(nomeTurma: string, termoBusca: string): number {
  const nome = nomeTurma.toLowerCase();
  const termo = termoBusca.toLowerCase();
  
  // Pontuação por tipo de match
  if (nome === termo) return 100; // Match exato
  if (nome.startsWith(termo)) return 90; // Começa com o termo
  if (nome.includes(` ${termo}`)) return 80; // Palavra completa
  if (nome.includes(termo)) return 70; // Contém o termo
  
  // Pontuação por palavras individuais
  const palavrasNome = nome.split(' ');
  const palavrasTermo = termo.split(' ');
  
  let pontuacao = 0;
  for (const palavraTermo of palavrasTermo) {
    for (const palavraNome of palavrasNome) {
      if (palavraNome.includes(palavraTermo)) {
        pontuacao += 30;
      }
    }
  }
  
  return Math.min(pontuacao, 60); // Máximo 60 para matches parciais
}

// Função para mapear turma do backend para frontend
function mapearTurma(turma: any, termoBusca: string): TurmaEncontrada | null {
  if (!turma || !turma.nome) return null;

  try {
    const turmaBase: TurmaResponse = {
      idTurma: String(turma.idTurma || turma.id || ''),
      nome: String(turma.nome || ''),
      ano: String(turma.ano || ''),
      idCurso: String(turma.idCurso || turma.id_curso || ''),
      idSecretaria: String(turma.idSecretaria || turma.id_secretaria || ''),
      alunos: turma.alunos || []
    };

    const turmaEncontrada: TurmaEncontrada = {
      ...turmaBase,
      nomeCurso: turma.nomeCurso || `Curso ${turmaBase.idCurso}`,
      quantidadeAlunos: (turma.alunos || []).length,
      relevancia: calcularRelevancia(turmaBase.nome, termoBusca)
    };

    return turmaEncontrada;
  } catch {
    return null;
  }
}

// ===== HOOK PRINCIPAL =====
export const useTurmaSearchSmart = (): UseTurmaSearchSmartReturn => {
  const [termoBusca, setTermoBusca] = useState('');
  const [resultados, setResultados] = useState<TurmaEncontrada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jaFezBusca, setJaFezBusca] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const limparBusca = useCallback(() => {
    setTermoBusca('');
    setResultados([]);
    setError(null);
    setJaFezBusca(false);
  }, []);

  // Função principal de busca
  const buscarPorNome = useCallback(async (nome: string): Promise<void> => {
    if (!nome || nome.trim().length < 2) {
      setError('Digite pelo menos 2 caracteres para buscar');
      return;
    }

    setLoading(true);
    setError(null);
    setResultados([]);
    setJaFezBusca(true);

    try {
      const api = getAPIClient();
      
      // ESTRATÉGIA: Buscar todas as turmas e filtrar localmente
      // Isso é mais eficiente que fazer múltiplas requisições
      
      const endpointsPossiveis = [
        '/turma/todas',
        '/turmas',
        '/turma/listar',
        '/api/turma/todas',
        '/api/turmas',
        '/turma',
      ];

      let todasTurmas: any[] = [];
      let conseguiuBuscar = false;

      // Tentar buscar lista completa
      for (const endpoint of endpointsPossiveis) {
        try {
          const response = await api.get(endpoint);
          
          if (response.data) {
            let dados = response.data;
            
            // Normalizar resposta
            if (!Array.isArray(dados)) {
              if (dados.turmas) dados = dados.turmas;
              else if (dados.data) dados = dados.data;
              else if (dados.content) dados = dados.content;
              else if (dados.items) dados = dados.items;
              else dados = [dados];
            }

            if (Array.isArray(dados) && dados.length > 0) {
              todasTurmas = dados;
              conseguiuBuscar = true;
              break;
            }
          }
        } catch {
          continue;
        }
      }

      // Se não conseguiu buscar todas, tentar endpoint com parâmetros
      if (!conseguiuBuscar) {
        try {
          const response = await api.get('/turma/buscar', {
            params: { nome: nome.trim() }
          });
          
          if (response.data) {
            let dados = response.data;
            if (!Array.isArray(dados)) {
              dados = dados.turmas || dados.data || [dados];
            }
            todasTurmas = dados;
            conseguiuBuscar = true;
          }
        } catch {
          throw new Error('Não foi possível acessar a lista de turmas');
        }
      }

      if (!conseguiuBuscar) {
        throw new Error('Nenhum endpoint de listagem funcionou');
      }

      // FILTRAR E PROCESSAR RESULTADOS
      const termoPesquisa = nome.trim().toLowerCase();
      const turmasEncontradas: TurmaEncontrada[] = [];

      for (const turma of todasTurmas) {
        const nomeTurma = (turma.nome || '').toLowerCase();
        
        // Verificar se o nome da turma corresponde à busca
        if (nomeTurma.includes(termoPesquisa) || 
            termoPesquisa.includes(nomeTurma) ||
            nomeTurma.split(' ').some(palavra => palavra.includes(termoPesquisa)) ||
            termoPesquisa.split(' ').some(palavra => nomeTurma.includes(palavra))) {
          
          const turmaMapeada = mapearTurma(turma, nome);
          if (turmaMapeada) {
            turmasEncontradas.push(turmaMapeada);
          }
        }
      }

      // ORDENAR POR RELEVÂNCIA
      turmasEncontradas.sort((a, b) => b.relevancia - a.relevancia);

      setResultados(turmasEncontradas);

      if (turmasEncontradas.length === 0) {
        setError(`Nenhuma turma encontrada com o nome "${nome}"`);
      }

    } catch (err: unknown) {
      const { message } = handleApiError(err, 'BuscarTurmasPorNome');
      setError(`Erro ao buscar turmas: ${message}`);
      setResultados([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    termoBusca,
    resultados,
    loading,
    error,
    jaFezBusca,
    setTermoBusca,
    buscarPorNome,
    limparBusca,
    clearError,
  };
};