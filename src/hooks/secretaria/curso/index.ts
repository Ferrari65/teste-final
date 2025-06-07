// src/hooks/secretaria/curso/index.ts - VERSÃO CORRIGIDA COM DEBUG

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
} from '@/schemas';

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

interface UseCursoFormOptions {
  onSuccess?: () => void;
  initialData?: Partial<CursoFormData>;
}

// ===== FORMULÁRIO DE CURSO =====
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
        form.reset();
        onSuccess?.();
      } catch (err: unknown) {
        console.error('❌ [CURSO FORM] Erro:', err);
        const { message } = handleApiError(err, 'CreateCurso');
        if (message.includes('já cadastrado')) {
          setError('Este curso já está cadastrado no sistema.');
        } else {
          setError(message);
        }
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

// ===== LISTAGEM DE CURSOS - CORRIGIDA COM MÚLTIPLOS ENDPOINTS =====
export const useCursoList = (): UseCursoListReturn => {
  const [cursos, setCursos] = useState<CursoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const clearError = useCallback(() => setError(null), []);

  const fetchCursos = useCallback(async (): Promise<void> => {
    console.log('🔍 [CURSO LIST] Iniciando fetchCursos...');
    console.log('👤 [CURSO LIST] User:', user);
    console.log('🆔 [CURSO LIST] User ID:', user?.id);

    if (!user?.id) {
      console.log('❌ [CURSO LIST] Sem user.id, cancelando fetch');
      setError('ID da secretaria não encontrado. Faça login novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    // Lista de endpoints para tentar
    const endpoints = [
      `/curso/${user.id}/secretaria`,  // Endpoint original
      `/curso/${user.id}`,             // Endpoint alternativo 1
      `/curso/list/${user.id}`,        // Endpoint alternativo 2
      `/curso/secretaria/${user.id}`,  // Endpoint alternativo 3
      '/curso',                        // Endpoint genérico
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`📡 [CURSO LIST] Tentando endpoint: ${endpoint}`);
        
        const api = getAPIClient();
        const response = await api.get(endpoint);
        
        console.log(`✅ [CURSO LIST] Sucesso em ${endpoint}:`, response);
        console.log(`📊 [CURSO LIST] Response data:`, response.data);
        console.log(`📏 [CURSO LIST] Response data length:`, response.data?.length || 0);
        
        // Validar estrutura da resposta
        if (!response.data) {
          console.log(`⚠️ [CURSO LIST] Response.data é null/undefined em ${endpoint}`);
          continue;
        }

        // Se não é array, tentar acessar propriedade aninhada
        let cursosData = response.data;
        if (!Array.isArray(cursosData)) {
          console.log(`⚠️ [CURSO LIST] Response.data não é array em ${endpoint}:`, typeof cursosData);
          
          // Tentar propriedades comuns onde os dados podem estar aninhados
          if (cursosData.cursos && Array.isArray(cursosData.cursos)) {
            cursosData = cursosData.cursos;
            console.log(`✅ [CURSO LIST] Encontrado em .cursos:`, cursosData);
          } else if (cursosData.data && Array.isArray(cursosData.data)) {
            cursosData = cursosData.data;
            console.log(`✅ [CURSO LIST] Encontrado em .data:`, cursosData);
          } else if (cursosData.content && Array.isArray(cursosData.content)) {
            cursosData = cursosData.content;
            console.log(`✅ [CURSO LIST] Encontrado em .content:`, cursosData);
          } else {
            console.log(`❌ [CURSO LIST] Estrutura não reconhecida em ${endpoint}`);
            continue;
          }
        }

        console.log(`✅ [CURSO LIST] Dados válidos obtidos de ${endpoint}`);
        
        // Log de cada curso individual
        cursosData.forEach((curso: any, index: number) => {
          console.log(`📚 [CURSO LIST] Curso ${index}:`, {
            id_curso: curso.id_curso,
            nome: curso.nome,
            duracao: curso.duracao,
            situacao: curso.situacao
          });
        });

        setCursos(cursosData || []);
        setLoading(false);
        return; // Sucesso! Sair do loop
        
      } catch (err: unknown) {
        console.error(`❌ [CURSO LIST] Erro em ${endpoint}:`, err);
        
        // Se não é o último endpoint, continuar tentando
        if (endpoint !== endpoints[endpoints.length - 1]) {
          continue;
        }
        
        // Se chegou aqui, todos os endpoints falharam
        const { message, status } = handleApiError(err, 'FetchCursos');
        
        console.log(`🚫 [CURSO LIST] Todos os endpoints falharam. Último erro:`, {
          message,
          status,
          lastEndpoint: endpoint
        });
        
        // Mensagens específicas por tipo de erro
        if (status === 404) {
          setError('Nenhum endpoint de cursos encontrado. Verifique se o backend está rodando corretamente.');
        } else if (status === 401) {
          setError('Sem autorização. Faça login novamente.');
        } else if (status === 403) {
          setError('Sem permissão para acessar os cursos.');
        } else if (status === 500) {
          setError('Erro interno do servidor. Tente novamente.');
        } else {
          setError(`Erro ao carregar cursos: ${message}`);
        }
        
        setCursos([]);
      }
    }

    setLoading(false);
    console.log('🏁 [CURSO LIST] fetchCursos finalizado');
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

// ===== TIPOS PARA USO EXTERNO =====
export type { CursoFormProps, UseCursoFormReturn, UseCursoListReturn };