// src/hooks/secretaria/curso/index.ts - VERSÃO CORRIGIDA COM ENDPOINTS CORRETOS

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
  type CursoUpdateSituacao,
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
}

interface UseCursoActionsReturn {
  updateSituacao: (cursoId: number, situacao: 'ATIVO' | 'INATIVO') => Promise<void>;
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
  console.error(`❌ [CURSO ${context}] Erro:`, error);
  
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

function mapCursoResponse(curso: any): CursoResponse {
  if (!curso) {
    throw new Error('Dados do curso inválidos');
  }

  // Log para debug
  console.log('🔍 [MAP CURSO] Dados recebidos:', curso);

  const id_curso = curso.id_curso || curso.idCurso || curso.id;
  const nome = curso.nome || '';
  const duracao = curso.duracao || 0;
  const id_secretaria = curso.id_secretaria || curso.idSecretaria || '';
  const situacao = curso.situacao || 'ATIVO';

  // Validações com logs
  if (!id_curso) {
    console.error('❌ [MAP CURSO] ID do curso não encontrado em:', curso);
    throw new Error('ID do curso não encontrado');
  }
  if (!nome || nome.trim() === '') {
    console.error('❌ [MAP CURSO] Nome do curso não encontrado em:', curso);
    throw new Error('Nome do curso não encontrado');
  }
  if (!duracao || Number(duracao) <= 0) {
    console.error('❌ [MAP CURSO] Duração do curso inválida em:', curso);
    throw new Error('Duração do curso inválida');
  }

  const cursoMapeado = {
    id_curso: Number(id_curso),
    nome: String(nome).trim(),
    duracao: Number(duracao),
    id_secretaria: String(id_secretaria),
    situacao: situacao as 'ATIVO' | 'INATIVO'
  };

  console.log('✅ [MAP CURSO] Curso mapeado:', cursoMapeado);
  return cursoMapeado;
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
        
        console.log('✅ [CURSO FORM] Curso criado:', response.data);
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

// ===== HOOK: LISTAGEM DE CURSOS =====
export const useCursoList = (): UseCursoListReturn => {
  const [cursos, setCursos] = useState<CursoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const clearError = useCallback(() => setError(null), []);

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
          console.warn('⚠️ [CURSO LIST] Erro ao mapear curso:', curso, mappingError);
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
  };
};

// ===== HOOK: AÇÕES DE CURSO =====
export const useCursoActions = (): UseCursoActionsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  // PUT /curso/{id_curso}/situacao
  const updateSituacao = useCallback(async (
    cursoId: number, 
    situacao: 'ATIVO' | 'INATIVO'
  ): Promise<void> => {
    // Logs detalhados para debug
    console.log('🔄 [UPDATE SITUACAO] Iniciando atualização...');
    console.log('📋 [UPDATE SITUACAO] Curso ID:', cursoId, typeof cursoId);
    console.log('📋 [UPDATE SITUACAO] Situação:', situacao, typeof situacao);

    if (!cursoId || cursoId <= 0) {
      console.error('❌ [UPDATE SITUACAO] ID do curso inválido:', cursoId);
      setError('ID do curso inválido');
      return;
    }

    // Validação rigorosa da situação
    if (!situacao || !['ATIVO', 'INATIVO'].includes(situacao)) {
      console.error('❌ [UPDATE SITUACAO] Situação inválida:', situacao);
      setError('Situação deve ser ATIVO ou INATIVO');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Garantir que a situação está exatamente como esperado
      const updateDTO: CursoUpdateSituacao = { 
        situacao: situacao.toUpperCase() as 'ATIVO' | 'INATIVO'
      };
      
      console.log('📤 [UPDATE SITUACAO] Enviando para API:', {
        url: `/curso/${cursoId}/situacao`,
        body: updateDTO
      });
      
      const api = getAPIClient();
      const response = await api.put(`/curso/${cursoId}/situacao`, updateDTO);
      
      console.log('✅ [UPDATE SITUACAO] Resposta da API:', response.data);
      console.log('✅ [UPDATE SITUACAO] Status da resposta:', response.status);
      
      setSuccessMessage(`Curso ${situacao.toLowerCase()} com sucesso!`);
      
    } catch (err: unknown) {
      console.error('❌ [UPDATE SITUACAO] Erro completo:', err);
      
      // Log detalhado do erro
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        console.error('❌ [UPDATE SITUACAO] Status:', axiosError.response?.status);
        console.error('❌ [UPDATE SITUACAO] Data:', axiosError.response?.data);
        console.error('❌ [UPDATE SITUACAO] Headers:', axiosError.response?.headers);
      }
      
      const errorMessage = handleCursoError(err, 'UpdateCursoSituacao');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETE /curso/{id_curso} - REMOVIDO (endpoint não existe)
  // Funcionalidade de deletar removida

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
    updateSituacao: useCallback(async (cursoId: number, situacao: 'ATIVO' | 'INATIVO') => {
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