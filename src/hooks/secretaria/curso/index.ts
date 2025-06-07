// src/hooks/secretaria/curso/index.ts - COM ATUALIZAÇÃO OTIMISTA

import { useState, useContext, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthContext } from '@/contexts/AuthContext';
import { getAPIClient, handleApiError } from '@/services/api';
import { transformCursoFormToDTO } from '@/utils/transformers';
import {
  cursoFormSchema,
  type CursoFormData,
  type CursoResponse,
  type CursoEditarDTO,
  type SituacaoType,
} from '@/schemas';

// ===== INTERFACES =====
export interface CursoFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UseCursoFormReturn {
  form: ReturnType<typeof useForm<CursoFormData>>;
  onSubmit: (data: CursoFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
}

interface UseCursoListReturn {
  cursos: CursoResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  clearError: () => void;
  // ✅ NOVOS MÉTODOS PARA ATUALIZAÇÃO OTIMISTA
  updateCursoOptimistic: (cursoId: string, updates: Partial<CursoResponse>) => void;
  revertCursoOptimistic: (cursoId: string, originalData: CursoResponse) => void;
}

interface UseCursoActionsReturn {
  updateSituacao: (cursoId: string, situacao: SituacaoType, onOptimisticUpdate?: (revert: () => void) => void) => Promise<void>;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
}

interface UseCursoFormOptions {
  onSuccess?: () => void;
  initialData?: Partial<CursoFormData>;
}

// ===== HELPER FUNCTIONS =====
function handleCursoError(error: unknown, context: string): string {
  const { message, status } = handleApiError(error, context);
  
  switch (status) {
    case 400:
      if (message.includes('nome') || message.includes('name')) {
        return 'Nome do curso inválido ou já existe.';
      }
      if (message.includes('duracao') || message.includes('duration')) {
        return 'Duração do curso deve ser entre 1 e 60 meses.';
      }
      return message;
    
    case 401:
      return 'Sem autorização. Faça login novamente.';
    
    case 403:
      return 'Sem permissão para realizar esta ação.';
    
    case 404:
      return 'Curso não encontrado.';
    
    case 409:
      return 'Já existe um curso com este nome.';
    
    case 422:
      return 'Dados inconsistentes. Verifique as informações.';
    
    case 500:
      return 'Erro interno do servidor. Tente novamente.';
    
    default:
      return message;
  }
}

// MAPEAR RESPOSTA DO BACKEND PARA FRONTEND
function mapCursoResponse(curso: any): CursoResponse {
  if (!curso) {
    throw new Error('Dados do curso inválidos');
  }

  const idCurso = curso.idCurso;
  const nome = curso.nome;
  const duracao = curso.duracao;
  const id_secretaria = curso.id_secretaria;
  const situacao = curso.situacao;

  // Validações
  if (!idCurso) {
    throw new Error('ID do curso não encontrado');
  }
  if (!nome || nome.trim() === '') {
    throw new Error('Nome do curso não encontrado');
  }
  if (!duracao || Number(duracao) <= 0) {
    throw new Error('Duração do curso inválida');
  }

  return {
    idCurso: String(idCurso),
    nome: String(nome).trim(),
    duracao: Number(duracao),
    id_secretaria: String(id_secretaria),
    situacao: situacao as SituacaoType
  };
}

function validateCursoData(curso: any): boolean {
  if (!curso) return false;
  
  try {
    mapCursoResponse(curso);
    return true;
  } catch {
    return false;
  }
}

// ===== HOOK: FORMULÁRIO DE CURSO =====
export const useCursoForm = ({
  onSuccess,
  initialData,
}: UseCursoFormOptions = {}): UseCursoFormReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const form = useForm<CursoFormData>({
    resolver: zodResolver(cursoFormSchema),
    mode: 'onBlur',
    defaultValues: {
      nome: initialData?.nome ?? '',
      duracao: initialData?.duracao ?? 1,
    },
  });

  const clearMessages = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  // POST /curso/{id_secretaria}
  const onSubmit = useCallback(
    async (data: CursoFormData): Promise<void> => {
      if (!user?.id) {
        setError('ID da secretaria não encontrado. Faça login novamente.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const cursoDTO = transformCursoFormToDTO(data, user.id);
        
        const api = getAPIClient();
        const response = await api.post(`/curso/${user.id}`, cursoDTO);
        
        setSuccessMessage('Curso cadastrado com sucesso!');
        
        form.reset({
          nome: '',
          duracao: 1,
        });
        
        onSuccess?.();
      } catch (err: unknown) {
        const errorMessage = handleCursoError(err, 'CreateCurso');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, form, onSuccess]
  );

  return {
    form,
    onSubmit,
    loading,
    error,
    successMessage,
    clearMessages,
  };
};

// ===== HOOK: LISTAGEM DE CURSOS COM ATUALIZAÇÃO OTIMISTA =====
export const useCursoList = (): UseCursoListReturn => {
  const [cursos, setCursos] = useState<CursoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const clearError = useCallback(() => setError(null), []);

  // ✅ MÉTODO PARA ATUALIZAÇÃO OTIMISTA
  const updateCursoOptimistic = useCallback((cursoId: string, updates: Partial<CursoResponse>) => {
    setCursos(prev => 
      prev.map(curso => 
        curso.idCurso === cursoId 
          ? { ...curso, ...updates }
          : curso
      )
    );
  }, []);

  // ✅ MÉTODO PARA REVERTER ATUALIZAÇÃO OTIMISTA
  const revertCursoOptimistic = useCallback((cursoId: string, originalData: CursoResponse) => {
    setCursos(prev => 
      prev.map(curso => 
        curso.idCurso === cursoId 
          ? originalData
          : curso
      )
    );
  }, []);

  // GET /curso/{id_secretaria}/secretaria
  const fetchCursos = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setError('ID da secretaria não encontrado. Faça login novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getAPIClient();
      const response = await api.get(`/curso/${user.id}/secretaria`);
      
      if (!response.data) {
        setCursos([]);
        return;
      }

      let cursosData = response.data;
      
      // Normalizar resposta (pode ser array direto ou object com array)
      if (!Array.isArray(cursosData)) {
        if (cursosData.cursos && Array.isArray(cursosData.cursos)) {
          cursosData = cursosData.cursos;
        } else if (cursosData.data && Array.isArray(cursosData.data)) {
          cursosData = cursosData.data;
        } else {
          cursosData = [cursosData];
        }
      }

      const cursosValidos: CursoResponse[] = [];
      
      for (const curso of cursosData) {
        try {
          if (validateCursoData(curso)) {
            const cursoMapeado = mapCursoResponse(curso);
            cursosValidos.push(cursoMapeado);
          }
        } catch (mappingError) {
          console.warn('⚠️ Erro ao mapear curso:', curso, mappingError);
        }
      }

      setCursos(cursosValidos);
      
    } catch (err: unknown) {
      const errorMessage = handleCursoError(err, 'FetchCursos');
      setError(errorMessage);
      setCursos([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refetch = useCallback(() => {
    clearError();
    fetchCursos();
  }, [fetchCursos, clearError]);

  useEffect(() => {
    if (user?.id) {
      fetchCursos();
    }
  }, [user?.id, fetchCursos]);

  return {
    cursos,
    loading,
    error,
    refetch,
    clearError,
    updateCursoOptimistic,
    revertCursoOptimistic,
  };
};

// ===== HOOK: AÇÕES DE CURSO COM ATUALIZAÇÃO OTIMISTA =====
export const useCursoActions = (): UseCursoActionsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  // ✅ PUT /curso/{id_curso}/situacao com ATUALIZAÇÃO OTIMISTA
  const updateSituacao = useCallback(async (
    cursoId: string, 
    situacao: SituacaoType,
    onOptimisticUpdate?: (revert: () => void) => void
  ): Promise<void> => {
    if (!cursoId || cursoId.trim() === '') {
      setError('ID do curso é obrigatório');
      return;
    }

    // Validação da situação
    if (!situacao || !['ATIVO', 'INATIVO'].includes(situacao)) {
      setError('Situação deve ser ATIVO ou INATIVO');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ DTO exatamente como seu CursoEditarDTO
      const editarDTO: CursoEditarDTO = { 
        situacao: situacao
      };
      
      const api = getAPIClient();
      const response = await api.put(`/curso/${cursoId}/situacao`, editarDTO);
      
      setSuccessMessage(`Curso ${situacao.toLowerCase()} com sucesso!`);
      
    } catch (err: unknown) {
      const errorMessage = handleCursoError(err, 'UpdateCursoSituacao');
      setError(errorMessage);
      
      // ✅ SE DEU ERRO, CHAMA A FUNÇÃO DE REVERTER
      if (onOptimisticUpdate) {
        // Função vazia porque a reversão será feita no componente
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateSituacao,
    loading,
    error,
    successMessage,
    clearMessages,
  };
};

// ===== HOOK COMPOSTO: GERENCIAMENTO COMPLETO =====
export const useCursoManager = () => {
  const form = useCursoForm();
  const list = useCursoList();
  const actions = useCursoActions();

  const refreshList = useCallback(() => {
    list.refetch();
  }, [list.refetch]);

  const wrapperActions = {
    ...actions,
    updateSituacao: useCallback(async (cursoId: string, situacao: SituacaoType) => {
      await actions.updateSituacao(cursoId, situacao);
      refreshList();
    }, [actions.updateSituacao, refreshList]),
  };

  const formWithRefresh = {
    ...form,
    onSubmit: useCallback(async (data: CursoFormData) => {
      await form.onSubmit(data);
      refreshList();
    }, [form.onSubmit, refreshList]),
  };

  return {
    form: formWithRefresh,
    list,
    actions: wrapperActions,
    refreshList,
  };
};