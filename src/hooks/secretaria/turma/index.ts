// src/hooks/secretaria/turma/index.ts - CORRIGIDO PARA API REAL

import { useState, useContext, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthContext } from '@/contexts/AuthContext';
import { getAPIClient, handleApiError } from '@/services/api';
import { transformTurmaFormToDTO } from '@/utils/transformers';
import {
  turmaFormSchema,
  type TurmaFormData,
  type TurmaResponse,
} from '@/schemas';
import { AxiosError } from 'axios';

// ===== INTERFACES =====
export interface TurmaFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export interface UseTurmaFormReturn {
  form: ReturnType<typeof useForm<TurmaFormData>>;
  onSubmit: (data: TurmaFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
}

interface UseTurmaFormOptions {
  onSuccess?: () => void;
  initialData?: Partial<TurmaFormData>;
}

// ===== HELPER FUNCTIONS =====
function handleSubmitError(error: unknown): string {
  if (!(error instanceof Error) && typeof error !== 'object') {
    return String(error);
  }

  const axiosError = error as AxiosError;
  const status = axiosError.response?.status;
  const responseData = axiosError.response?.data as { message?: string; error?: string } | undefined;

  console.error('❌ Erro completo:', axiosError);
  console.error('❌ Response data:', responseData);
  console.error('❌ Status:', status);
  console.error('❌ URL tentada:', axiosError.config?.url);

  // Tratamento específico por status
  switch (status) {
    case 400:
      const errorMsg = responseData?.message || responseData?.error;
      return errorMsg 
        ? `Erro de validação: ${errorMsg}`
        : 'Dados inválidos. Verifique se todos os campos estão corretos.';
    
    case 404:
      return 'Endpoint não encontrado. Verifique se o backend está rodando.';
    
    case 500:
      return 'Erro interno do servidor. Tente novamente.';
    
    default:
      const { message } = handleApiError(axiosError, 'CreateTurma');
      return message;
  }
}

// ===== HOOK: FORMULÁRIO DE TURMA (CORRIGIDO) =====
export const useTurmaForm = ({
  onSuccess,
  initialData,
}: UseTurmaFormOptions = {}): UseTurmaFormReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const form = useForm<TurmaFormData>({
    resolver: zodResolver(turmaFormSchema),
    mode: 'onBlur',
    defaultValues: {
      nome: initialData?.nome ?? '',
      id_curso: initialData?.id_curso ?? '',
      ano: initialData?.ano ?? new Date().getFullYear().toString(),
      turno: initialData?.turno ?? 'DIURNO',
    },
  });

  const clearMessages = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  const onSubmit = useCallback(
    async (data: TurmaFormData): Promise<void> => {
      console.log('📝 Dados do formulário:', data);
      
      if (!user?.id) {
        setError('ID da secretaria não encontrado. Faça login novamente.');
        return;
      }

      if (!data.id_curso) {
        setError('Curso é obrigatório. Selecione um curso.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // ✅ Usar transformer correto (apenas nome, ano, turno)
        const turmaDTO = transformTurmaFormToDTO(data);
        
        console.log('📤 Dados enviados para API:', turmaDTO);
        console.log('🆔 ID Secretaria (path):', user.id);
        console.log('🆔 ID Curso (path):', data.id_curso);
        
        const api = getAPIClient();
        
        // ✅ Endpoint correto + Body apenas com nome, ano, turno
        const response = await api.post(
          `/turma/criar/${user.id}/${data.id_curso}`, 
          turmaDTO
        );
        
        console.log('✅ Resposta da API:', response.data);

        setSuccessMessage('Turma cadastrada com sucesso!');
        form.reset({
          nome: '',
          id_curso: '',
          ano: new Date().getFullYear().toString(),
          turno: 'DIURNO',
        });
        onSuccess?.();
        
      } catch (error: unknown) {
        const errorMessage = handleSubmitError(error);
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

// ===== HOOK: BUSCAR TURMA (MANTIDO) =====
export interface UseTurmaSearchReturn {
  searchId: string;
  setSearchId: (id: string) => void;
  turma: TurmaResponse | null;
  loading: boolean;
  error: string | null;
  handleSearch: () => void;
  handleClear: () => void;
  clearError: () => void;
}

export const useTurmaSearch = (): UseTurmaSearchReturn => {
  const [searchId, setSearchId] = useState('');
  const [turma, setTurma] = useState<TurmaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const clearError = useCallback(() => setError(null), []);

  const handleSearch = useCallback(async (): Promise<void> => {
    if (!searchId.trim()) {
      setError('Digite um ID para buscar');
      return;
    }

    if (!user?.id) {
      setError('ID da secretaria não encontrado. Faça login novamente.');
      return;
    }

    setLoading(true);
    setError(null);
    setTurma(null);

    try {
      const api = getAPIClient();
      
      // Endpoint para buscar turma específica
      const response = await api.get(`/turma/buscarTurma/${searchId}`);
      
      console.log('✅ Turma encontrada:', response.data);
      
      if (response.data && typeof response.data === 'object') {
        setTurma(response.data as TurmaResponse);
      } else {
        setError('Resposta inválida do servidor');
      }
      
    } catch (error: unknown) {
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          setError(`Turma com ID "${searchId}" não encontrada`);
        } else {
          const { message } = handleApiError(axiosError, 'SearchTurma');
          setError(message);
        }
      } else {
        setError('Erro ao buscar turma');
      }
      setTurma(null);
    } finally {
      setLoading(false);
    }
  }, [searchId, user?.id]);

  const handleClear = useCallback(() => {
    setSearchId('');
    setTurma(null);
    setError(null);
  }, []);

  return {
    searchId,
    setSearchId,
    turma,
    loading,
    error,
    handleSearch,
    handleClear,
    clearError,
  };
};