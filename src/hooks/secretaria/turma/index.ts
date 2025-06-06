// src/hooks/secretaria/turma/index.ts
import { useState, useContext, useCallback, useEffect } from 'react';
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

// ===== INTERFACES =====
interface Turma {
  idTurma: string;
  nome: string;
  ano: string;
  idCurso: string;
  idSecretaria: string;
  alunos?: Array<{
    idAluno: string;
    nome: string;
    email: string;
    matricula: string;
    telefone: string;
    situacao: string;
    data_nasc: string;
  }>;
}

interface TurmaFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UseTurmaFormReturn {
  form: ReturnType<typeof useForm<TurmaFormData>>;
  onSubmit: (data: TurmaFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
}

interface UseTurmaListReturn {
  turmas: Turma[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  clearError: () => void;
}

interface UseTurmaFormOptions {
  onSuccess?: () => void;
  initialData?: Partial<TurmaFormData>;
}

// ===== FORMULÁRIO DE TURMA =====
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
      turno: initialData?.turno ?? 'DIURNO',
      ano: initialData?.ano ?? new Date().getFullYear().toString(),
    },
  });

  const clearMessages = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  const onSubmit = useCallback(
    async (data: TurmaFormData): Promise<void> => {
      console.log('📝 Dados do formulário:', data); // Para debug
      
      if (!user?.id) {
        setError('ID da secretaria não encontrado. Faça login novamente.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const turmaDTO = transformTurmaFormToDTO(data);
        console.log('📤 Enviando para API:', turmaDTO); // Para debug
        const api = getAPIClient();
        
        // POST /turma/criar/{id_secretaria}/{id_curso} - usando curso fixo para teste
        const cursoFixo = 'curso-teste-123'; // Curso fictício para teste
        const response = await api.post(`/turma/criar/${user.id}/${cursoFixo}`, turmaDTO);
        console.log('✅ Resposta da API:', response.data); // Para debug

        setSuccessMessage('Turma cadastrada com sucesso!');
        form.reset();
        onSuccess?.();
      } catch (err: unknown) {
        console.error('❌ Erro na API:', err); // Para debug
        const { message } = handleApiError(err, 'CreateTurma');
        if (message.includes('já cadastrada')) {
          setError('Esta turma já está cadastrada no sistema.');
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

// ===== BUSCAR TURMA POR ID =====
export const useTurmaBuscar = () => {
  const [turma, setTurma] = useState<Turma | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const buscarTurma = useCallback(async (idTurma: string): Promise<void> => {
    if (!idTurma || idTurma.trim() === '') {
      setError('ID da turma é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);
    setTurma(null);

    try {
      const api = getAPIClient();
      // GET /turma/buscarTurma/{id_turma}
      const response = await api.get(`/turma/buscarTurma/${idTurma}`);
      setTurma(response.data || null);
    } catch (err: unknown) {
      const { message } = handleApiError(err, 'BuscarTurma');
      setError(message);
      setTurma(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const limparTurma = useCallback(() => {
    setTurma(null);
    setError(null);
  }, []);

  return {
    turma,
    loading,
    error,
    buscarTurma,
    limparTurma,
    clearError,
  };
};

// ===== COMPONENTE DE BUSCA (para usar na interface) =====
export const useTurmaSearch = () => {
  const [searchId, setSearchId] = useState('');
  const { turma, loading, error, buscarTurma, limparTurma, clearError } = useTurmaBuscar();

  const handleSearch = useCallback(async () => {
    if (searchId.trim()) {
      await buscarTurma(searchId.trim());
    }
  }, [searchId, buscarTurma]);

  const handleClear = useCallback(() => {
    setSearchId('');
    limparTurma();
  }, [limparTurma]);

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

// ===== TIPOS PARA USO EXTERNO =====
export type { 
  Turma, 
  TurmaFormProps, 
  UseTurmaFormReturn, 
  UseTurmaListReturn 
};