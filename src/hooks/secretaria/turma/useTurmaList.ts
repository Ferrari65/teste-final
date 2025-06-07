// src/hooks/secretaria/turma/useTurmaForm.ts
// Hook apenas para cadastro de turmas (sem busca por ID)

import { useState, useContext, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthContext } from '@/contexts/AuthContext';
import { getAPIClient, handleApiError } from '@/services/api';
import { transformTurmaFormToDTO } from '@/utils/transformers';
import {
  turmaFormSchema,
  type TurmaFormData,
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

  // Tratamento específico por status
  switch (status) {
    case 400:
      const errorMsg = responseData?.message || responseData?.error;
      return errorMsg 
        ? `Erro de validação: ${errorMsg}`
        : 'Dados inválidos. Verifique se todos os campos estão corretos.';
    
    case 404:
      return 'Endpoint não encontrado. Verifique se o backend está rodando.';
    
    case 409:
      return 'Já existe uma turma com esse nome neste curso.';
    
    case 500:
      return 'Erro interno do servidor. Tente novamente.';
    
    default:
      const { message } = handleApiError(axiosError, 'CreateTurma');
      return message;
  }
}

// ===== HOOK: FORMULÁRIO DE TURMA =====
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
        // ✅ Usar transformer que só retorna nome, ano, turno
        const turmaDTO = transformTurmaFormToDTO(data);
        
        const api = getAPIClient();
        
        // ✅ Endpoint correto do seu backend
        const response = await api.post(
          `/turma/criar/${user.id}/${data.id_curso}`, 
          turmaDTO
        );

        setSuccessMessage('Turma cadastrada com sucesso!');
        
        // Reset do formulário
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