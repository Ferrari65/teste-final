// src/hooks/secretaria/turma/useTurmaForm.ts
// HOOK APENAS PARA CADASTRO - LIMPO E SIMPLES

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
  const { message, status } = handleApiError(error, 'CreateTurma');
  
  switch (status) {
    case 400:
      return 'Dados inválidos. Verifique se todos os campos estão corretos.';
    case 404:
      return 'Curso não encontrado. Verifique se o curso selecionado existe.';
    case 409:
      return 'Já existe uma turma com esse nome neste curso.';
    case 500:
      return 'Erro interno do servidor. Tente novamente.';
    default:
      return message;
  }
}

// ===== HOOK PRINCIPAL =====
export const useTurmaForm = ({
  onSuccess,
  initialData,
}: UseTurmaFormOptions = {}): UseTurmaFormReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  // Form setup
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

  // Limpar mensagens
  const clearMessages = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  // Submit principal
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
        const turmaDTO = transformTurmaFormToDTO(data);
        const api = getAPIClient();
        
        await api.post(`/turma/criar/${user.id}/${data.id_curso}`, turmaDTO);

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