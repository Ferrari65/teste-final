// src/hooks/secretaria/curso/index.ts - HOOK COMPLETO FINAL

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

// ===== INTERFACES LOCAIS (NÃO EXPORTADAS) =====
interface CursoFormProps {
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
  getCurso: (cursoId: number) => Promise<CursoResponse | null>;
  deleteCurso: (cursoId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
}

interface CursoSearchReturn {
  searchId: string;
  setSearchId: (id: string) => void;
  curso: CursoResponse | null;
  loading: boolean;
  error: string | null;
  handleSearch: () => void;
  handleClear: () => void;
  clearError: () => void;
}

interface UseCursoFormOptions {
  onSuccess?: () => void;
  initialData?: Partial<CursoFormData>;
}

// ===== HELPER FUNCTIONS =====
function handleCursoError(error: unknown, context: string): string {
  console.error(`❌ [CURSO ${context}] Erro:`, error);
  
  const { message, status } = handleApiError(error, context);
  
  // Mensagens específicas para curso
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
      return context.includes('Get') || context.includes('Update') || context.includes('Delete')
        ? 'Curso não encontrado.'
        : 'Nenhum curso encontrado para esta secretaria.';
    
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
  return {
    id_curso: Number(curso.id_curso),
    nome: curso.nome,
    duracao: Number(curso.duracao),
    id_secretaria: String(curso.id_secretaria),
    situacao: curso.situacao || 'ATIVO'
    // ❌ data_alteracao - NÃO incluir no front
  };
}

function validateCursoData(curso: any): boolean {
  const hasValidId = curso.id_curso !== undefined && 
                    curso.id_curso !== null && 
                    (typeof curso.id_curso === 'number' || 
                     !isNaN(parseInt(String(curso.id_curso), 10)));
  
  const hasValidNome = curso.nome && typeof curso.nome === 'string' && curso.nome.trim() !== '';
  const hasValidDuracao = curso.duracao && Number(curso.duracao) > 0;
  
  return hasValidId && hasValidNome && hasValidDuracao;
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

  const onSubmit = useCallback(
    async (data: CursoFormData): Promise<void> => {
      console.log('📝 [CURSO FORM] Dados do formulário:', data);

      if (!user?.id) {
        setError('ID da secretaria não encontrado. Faça login novamente.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const cursoDTO = transformCursoFormToDTO(data, user.id);
        console.log('📤 [CURSO FORM] Enviando dados:', cursoDTO);
        
        const api = getAPIClient();
        const response = await api.post(`/curso/${user.id}`, cursoDTO);
        
        console.log('✅ [CURSO FORM] Curso criado:', response.data);
        setSuccessMessage('Curso cadastrado com sucesso!');
        
        // Reset do formulário
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

  const fetchCursos = useCallback(async (): Promise<void> => {
    console.log('🔍 [CURSO LIST] Iniciando fetchCursos...');
    console.log('👤 [CURSO LIST] User:', { id: user?.id, role: user?.role });

    if (!user?.id) {
      console.log('❌ [CURSO LIST] Sem user.id, cancelando fetch');
      setError('ID da secretaria não encontrado. Faça login novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getAPIClient();
      
      console.log(`📡 [CURSO LIST] Buscando cursos: /curso/${user.id}/secretaria`);
      
      const response = await api.get(`/curso/${user.id}/secretaria`);
      
      console.log(`✅ [CURSO LIST] Resposta:`, response.data);
      
      if (!response.data) {
        setCursos([]);
        return;
      }

      // Tentar extrair array de cursos da resposta
      let cursosData = response.data;
      if (!Array.isArray(cursosData)) {
        if (cursosData.cursos && Array.isArray(cursosData.cursos)) {
          cursosData = cursosData.cursos;
        } else if (cursosData.data && Array.isArray(cursosData.data)) {
          cursosData = cursosData.data;
        } else if (cursosData.content && Array.isArray(cursosData.content)) {
          cursosData = cursosData.content;
        } else {
          // Se response.data não é array e não tem propriedades conhecidas,
          // assumir que é um único curso
          cursosData = [cursosData];
        }
      }

      // Filtrar e mapear cursos válidos
      const cursosValidos = cursosData
        .filter(validateCursoData)
        .map(mapCursoResponse);

      console.log(`✅ [CURSO LIST] Cursos válidos: ${cursosValidos.length}/${cursosData.length}`);
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
    console.log('🔄 [CURSO LIST] Refetch solicitado');
    clearError();
    fetchCursos();
  }, [fetchCursos, clearError]);

  useEffect(() => {
    console.log('🔄 [CURSO LIST] useEffect disparado, user.id:', user?.id);
    if (user?.id) {
      fetchCursos();
    } else {
      console.log('⏭️ [CURSO LIST] Sem user.id, pulando fetch inicial');
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

  // ✅ ATUALIZAR SITUAÇÃO DO CURSO
  const updateSituacao = useCallback(async (
    cursoId: number, 
    situacao: 'ATIVO' | 'INATIVO'
  ): Promise<void> => {
    if (!cursoId || cursoId <= 0) {
      setError('ID do curso inválido');
      return;
    }

    if (!['ATIVO', 'INATIVO'].includes(situacao)) {
      setError('Situação deve ser ATIVO ou INATIVO');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateDTO: CursoUpdateSituacao = { situacao };
      console.log('📤 [CURSO UPDATE] Atualizando situação:', { cursoId, updateDTO });
      
      const api = getAPIClient();
      const response = await api.put(`/curso/${cursoId}/situacao`, updateDTO);
      
      console.log('✅ [CURSO UPDATE] Situação atualizada:', response.data);
      setSuccessMessage(`Curso ${situacao.toLowerCase()} com sucesso!`);
      
    } catch (err: unknown) {
      const errorMessage = handleCursoError(err, 'UpdateCursoSituacao');
      setError(errorMessage);
      throw err; // Re-throw para componente tratar
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ BUSCAR CURSO ESPECÍFICO
  const getCurso = useCallback(async (cursoId: number): Promise<CursoResponse | null> => {
    if (!cursoId || cursoId <= 0) {
      setError('ID do curso inválido');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [CURSO GET] Buscando curso:', cursoId);
      
      const api = getAPIClient();
      const response = await api.get(`/curso/${cursoId}`);
      
      console.log('✅ [CURSO GET] Curso encontrado:', response.data);
      
      if (!response.data) {
        throw new Error('Curso não encontrado');
      }

      if (!validateCursoData(response.data)) {
        throw new Error('Dados do curso inválidos');
      }

      const curso = mapCursoResponse(response.data);
      return curso;
      
    } catch (err: unknown) {
      const errorMessage = handleCursoError(err, 'GetCurso');
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ DELETAR CURSO (se endpoint existir)
  const deleteCurso = useCallback(async (cursoId: number): Promise<void> => {
    if (!cursoId || cursoId <= 0) {
      setError('ID do curso inválido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🗑️ [CURSO DELETE] Deletando curso:', cursoId);
      
      const api = getAPIClient();
      const response = await api.delete(`/curso/${cursoId}`);
      
      console.log('✅ [CURSO DELETE] Curso deletado:', response.data);
      setSuccessMessage('Curso deletado com sucesso!');
      
    } catch (err: unknown) {
      const errorMessage = handleCursoError(err, 'DeleteCurso');
      setError(errorMessage);
      throw err; // Re-throw para componente tratar
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateSituacao,
    getCurso,
    deleteCurso,
    loading,
    error,
    successMessage,
    clearMessages,
  };
};

// ===== HOOK: BUSCAR CURSO =====
export const useCursoSearch = (): CursoSearchReturn => {
  const [searchId, setSearchId] = useState('');
  const [curso, setCurso] = useState<CursoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleSearch = useCallback(async (): Promise<void> => {
    const trimmedId = searchId.trim();
    
    if (!trimmedId) {
      setError('Digite um ID para buscar');
      return;
    }

    const cursoId = parseInt(trimmedId, 10);
    if (isNaN(cursoId) || cursoId <= 0) {
      setError('ID do curso deve ser um número válido');
      return;
    }

    setLoading(true);
    setError(null);
    setCurso(null);

    try {
      console.log(`🔍 [CURSO SEARCH] Buscando curso ID: ${cursoId}`);
      
      const api = getAPIClient();
      const response = await api.get(`/curso/${cursoId}`);
      
      console.log('✅ [CURSO SEARCH] Curso encontrado:', response.data);
      
      if (!response.data) {
        throw new Error('Curso não encontrado');
      }

      if (!validateCursoData(response.data)) {
        throw new Error('Dados do curso inválidos');
      }

      const cursoData = mapCursoResponse(response.data);
      setCurso(cursoData);
      
    } catch (err: unknown) {
      const errorMessage = handleCursoError(err, 'SearchCurso');
      if (errorMessage.includes('não encontrado') || errorMessage.includes('404')) {
        setError(`Curso com ID "${trimmedId}" não encontrado`);
      } else {
        setError(errorMessage);
      }
      setCurso(null);
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  const handleClear = useCallback(() => {
    setSearchId('');
    setCurso(null);
    setError(null);
  }, []);

  return {
    searchId,
    setSearchId,
    curso,
    loading,
    error,
    handleSearch,
    handleClear,
    clearError,
  };
};

// ===== HOOK COMPOSTO: GERENCIAMENTO COMPLETO =====
export const useCursoManager = () => {
  const form = useCursoForm();
  const list = useCursoList();
  const actions = useCursoActions();
  const search = useCursoSearch();

  // Função para recarregar lista após operações
  const refreshList = useCallback(() => {
    list.refetch();
  }, [list.refetch]);

  // Wrapper para operações que afetam a lista
  const wrapperActions = {
    ...actions,
    updateSituacao: useCallback(async (cursoId: number, situacao: 'ATIVO' | 'INATIVO') => {
      await actions.updateSituacao(cursoId, situacao);
      refreshList();
    }, [actions.updateSituacao, refreshList]),
    
    deleteCurso: useCallback(async (cursoId: number) => {
      await actions.deleteCurso(cursoId);
      refreshList();
    }, [actions.deleteCurso, refreshList]),
  };

  // Form wrapper que recarrega lista após sucesso
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
    search,
    refreshList,
  };
};

// ===== EXPORTS APENAS DOS HOOKS =====
// Interfaces já existem em outros arquivos, exportando apenas as funções