// src/hooks/secretaria/turma/useTurmaList.ts
// ESTRATÉGIA PARA BACKEND COM UUID - FOCO EM ENDPOINTS DE LISTAGEM

import { useState, useContext, useCallback, useEffect } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { getAPIClient, handleApiError } from '@/services/api';
import type { TurmaResponse } from '@/schemas';

// ===== INTERFACE =====
export interface UseTurmaListReturn {
  turmas: TurmaResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  clearError: () => void;
}

// ===== HELPER FUNCTIONS =====
function handleTurmaError(error: unknown, context: string): string {
  const { message, status } = handleApiError(error, context);
  
  switch (status) {
    case 401:
      return 'Sem autorização. Faça login novamente.';
    case 403:
      return 'Sem permissão para visualizar turmas.';
    case 404:
      return 'Nenhuma turma encontrada para esta secretaria.';
    case 500:
      return 'Erro interno do servidor. Tente novamente.';
    default:
      return message;
  }
}

// Função para mapear dados das turmas (adaptada para UUID)
function mapTurmaParaFrontend(turma: any, secretariaId: string): TurmaResponse | null {
  if (!turma) return null;

  try {
    // Extrair dados independente do formato que vier do backend
    const idTurma = turma.idTurma || turma.id_turma || turma.id || '';
    const nome = turma.nome || '';
    const ano = turma.ano || '';
    const idCurso = turma.idCurso || turma.id_curso || '';
    const idSecretaria = turma.idSecretaria || turma.id_secretaria || secretariaId;
    const alunos = turma.alunos || [];

    // Validações mínimas
    if (!nome || nome.trim() === '') {
      return null;
    }

    // FILTRO: Dados limpos para o frontend
    return {
      idTurma: String(idTurma),
      nome: String(nome).trim(),
      ano: String(ano),
      idCurso: String(idCurso),
      idSecretaria: String(idSecretaria),
      alunos: Array.isArray(alunos) ? alunos : []
    };
  } catch {
    return null;
  }
}

// ===== HOOK PRINCIPAL =====
export const useTurmaList = (): UseTurmaListReturn => {
  const [turmas, setTurmas] = useState<TurmaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const clearError = useCallback(() => setError(null), []);

  // ESTRATÉGIA FOCADA EM ENDPOINTS DE LISTAGEM (sem busca por UUID)
  const fetchTurmas = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setError('ID da secretaria não encontrado. Faça login novamente.');
      return;
    }

    console.log('🔍 Buscando turmas para secretaria:', user.id);
    setLoading(true);
    setError(null);

    const api = getAPIClient();
    const turmasEncontradas: TurmaResponse[] = [];

    // Lista de endpoints para tentar (em ordem de prioridade)
    const endpointsPrioritarios = [
      // Padrão similar aos cursos
      `/turma/${user.id}/secretaria`,
      
      // Variações comuns
      `/turmas/${user.id}`,
      `/secretaria/${user.id}/turmas`,
      `/turma/secretaria/${user.id}`,
      
      // Com prefixo /api
      `/api/turma/${user.id}/secretaria`,
      `/api/turmas/${user.id}`,
      
      // Outros padrões
      `/turma/listar/${user.id}`,
      `/turma/buscar/secretaria/${user.id}`,
      `/turma/por-secretaria/${user.id}`,
      
      // Endpoints gerais (buscar todas e filtrar)
      `/turma/todas`,
      `/turmas/todas`,
      `/api/turma/todas`,
      
      // Fallback: tentar sem parâmetros e filtrar depois
      `/turma`,
      `/turmas`,
    ];

    let endpointFuncionou = false;

    for (let i = 0; i < endpointsPrioritarios.length; i++) {
      const endpoint = endpointsPrioritarios[i];
      
      try {
        console.log(`🔍 Tentativa ${i + 1}/${endpointsPrioritarios.length}: ${endpoint}`);
        
        const response = await api.get(endpoint);
        
        console.log(`✅ Endpoint funcionou: ${endpoint}`);
        console.log(`✅ Status: ${response.status}`);
        console.log(`✅ Data:`, response.data);
        
        if (response.data) {
          let dados = response.data;
          
          // Normalizar diferentes formatos de resposta
          if (!Array.isArray(dados)) {
            console.log('📝 Dados não são array, verificando propriedades...');
            
            if (dados.turmas && Array.isArray(dados.turmas)) {
              dados = dados.turmas;
              console.log('📝 Usando propriedade "turmas"');
            } else if (dados.data && Array.isArray(dados.data)) {
              dados = dados.data;
              console.log('📝 Usando propriedade "data"');
            } else if (dados.content && Array.isArray(dados.content)) {
              dados = dados.content;
              console.log('📝 Usando propriedade "content"');
            } else if (dados.items && Array.isArray(dados.items)) {
              dados = dados.items;
              console.log('📝 Usando propriedade "items"');
            } else {
              dados = [dados];
              console.log('📝 Transformando objeto único em array');
            }
          }

          console.log(`📝 Dados processados:`, dados);
          console.log(`📝 Quantidade de itens: ${dados.length}`);

          // Processar cada turma encontrada
          if (Array.isArray(dados)) {
            for (let j = 0; j < dados.length; j++) {
              const turma = dados[j];
              console.log(`📝 Processando turma ${j + 1}:`, turma);
              
              const turmaMapeada = mapTurmaParaFrontend(turma, user.id);
              
              if (turmaMapeada) {
                // Se é um endpoint geral, filtrar por secretaria
                const isEndpointGeral = endpoint.includes('/todas') || 
                                       endpoint === '/turma' || 
                                       endpoint === '/turmas';
                
                if (isEndpointGeral) {
                  // Filtrar apenas turmas da secretaria atual
                  if (turmaMapeada.idSecretaria === user.id) {
                    console.log(`✅ Turma da secretaria atual: ${turmaMapeada.nome}`);
                    turmasEncontradas.push(turmaMapeada);
                  } else {
                    console.log(`⏭️ Turma de outra secretaria: ${turmaMapeada.nome}`);
                  }
                } else {
                  // Endpoint específico da secretaria, adicionar todas
                  console.log(`✅ Turma encontrada: ${turmaMapeada.nome}`);
                  turmasEncontradas.push(turmaMapeada);
                }
              } else {
                console.log(`❌ Falha ao mapear turma ${j + 1}`);
              }
            }
          }

          endpointFuncionou = true;
          break; // Sucesso! Parar de tentar outros endpoints
        }
        
      } catch (err: unknown) {
        console.log(`❌ Endpoint falhou: ${endpoint}`, err);
        
        // Se é o último endpoint, mostrar erro
        if (i === endpointsPrioritarios.length - 1) {
          const errorMessage = handleTurmaError(err, 'FetchTurmas');
          setError(`Nenhum endpoint de listagem funcionou. Último erro: ${errorMessage}`);
        }
        
        // Continuar para o próximo endpoint
        continue;
      }
    }

    // Remover duplicatas (caso existam)
    const turmasUnicas = turmasEncontradas.filter((turma, index, array) => 
      array.findIndex(t => t.idTurma === turma.idTurma) === index
    );

    console.log(`🎯 Total de turmas únicas encontradas: ${turmasUnicas.length}`);
    setTurmas(turmasUnicas);
    
    // Se encontrou endpoint mas não há turmas
    if (endpointFuncionou && turmasUnicas.length === 0) {
      setError('Nenhuma turma cadastrada para esta secretaria.');
    }
    
    setLoading(false);
  }, [user?.id]);

  const refetch = useCallback(() => {
    clearError();
    fetchTurmas();
  }, [fetchTurmas, clearError]);

  useEffect(() => {
    if (user?.id) {
      fetchTurmas();
    }
  }, [user?.id, fetchTurmas]);

  return {
    turmas,
    loading,
    error,
    refetch,
    clearError,
  };
};