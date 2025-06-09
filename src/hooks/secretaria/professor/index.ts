// src/hooks/secretaria/professor/index.ts - HOOKS COMPLETOS CRUD PROFESSOR

import { useState, useContext, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthContext } from '@/contexts/AuthContext';
import { getAPIClient, handleApiError } from '@/services/api';
import { 
  professorFormSchema, 
  type ProfessorFormData,
  type ProfessorResponse,
  type ProfessorEditarDTO,
  type SituacaoType,
  cleanCPF,
  cleanPhone
} from '@/schemas/professor';

// ===== INTERFACES =====
export interface ProfessorFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  professorParaEditar?: ProfessorResponse; // Para modo edição
  modoEdicao?: boolean;
}

interface UseProfessorFormOptions {
  onSuccess?: () => void;
  initialData?: Partial<ProfessorFormData>;
  professorId?: string; // Para edição
}

interface UseProfessorFormReturn {
  form: ReturnType<typeof useForm<ProfessorFormData>>;
  onSubmit: (data: ProfessorFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
  modoEdicao: boolean;
}

interface UseProfessorListReturn {
  professores: ProfessorResponse[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  clearError: () => void;
  updateProfessorOptimistic: (professorId: string, updates: Partial<ProfessorResponse>) => void;
  revertProfessorOptimistic: (professorId: string, originalData: ProfessorResponse) => void;
}

interface UseProfessorActionsReturn {
  updateSituacao: (professorId: string, situacao: SituacaoType) => Promise<void>;
  deleteProfessor: (professorId: string) => Promise<void>;
  editarProfessor: (professorId: string, dados: ProfessorEditarDTO) => Promise<void>;
  buscarProfessor: (professorId: string) => Promise<ProfessorResponse | null>;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
}

// ===== HELPER FUNCTIONS =====
function handleProfessorError(error: unknown, context: string): string {
  const { message, status } = handleApiError(error, context);
  
  switch (status) {
    case 400:
      if (message.includes('CPF') || message.includes('cpf')) {
        return 'CPF inválido ou já cadastrado.';
      }
      if (message.includes('email')) {
        return 'Email inválido ou já cadastrado.';
      }
      return message;
    
    case 401:
      return 'Sem autorização. Faça login novamente.';
    
    case 403:
      return 'Sem permissão para realizar esta ação.';
    
    case 404:
      return 'Professor não encontrado.';
    
    case 409:
      return 'Já existe um professor com estes dados.';
    
    case 422:
      return 'Dados inconsistentes. Verifique as informações.';
    
    case 500:
      return 'Erro interno do servidor. Tente novamente.';
    
    default:
      return message;
  }
}

function transformFormToDTO(data: ProfessorFormData, secretariaId: string) {
  const cpfLimpo = cleanCPF(data.cpf);
  const telefoneLimpo = cleanPhone(data.telefone);
  const numeroInt = parseInt(data.numero, 10);

  if (isNaN(numeroInt) || numeroInt <= 0) {
    throw new Error('Número deve ser um valor válido maior que zero');
  }

  return {
    nome: data.nome.trim(),
    CPF: cpfLimpo,
    email: data.email.trim().toLowerCase(),
    senha: data.senha,
    logradouro: data.logradouro.trim(),
    bairro: data.bairro.trim(),
    numero: numeroInt,
    cidade: data.cidade.trim(),
    UF: data.uf.toUpperCase(),
    sexo: data.sexo,
    telefone: telefoneLimpo,
    data_nasc: data.data_nasc, // String no formato YYYY-MM-DD
    situacao: 'ATIVO' as const,
    id_secretaria: secretariaId
  };
}

// ===== 1. HOOK: FORMULÁRIO DE PROFESSOR =====
export const useProfessorForm = ({ 
  onSuccess, 
  initialData,
  professorId
}: UseProfessorFormOptions = {}): UseProfessorFormReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user } = useContext(AuthContext);
  
  const modoEdicao = Boolean(professorId);

  const form = useForm<ProfessorFormData>({
    resolver: zodResolver(professorFormSchema),
    mode: 'onBlur',
    defaultValues: {
      nome: initialData?.nome || '',
      cpf: initialData?.cpf || '',
      email: initialData?.email || '',
      senha: initialData?.senha || '',
      telefone: initialData?.telefone || '',
      data_nasc: initialData?.data_nasc || '',
      sexo: initialData?.sexo || 'M',
      logradouro: initialData?.logradouro || '',
      bairro: initialData?.bairro || '',
      numero: initialData?.numero || '',
      cidade: initialData?.cidade || '',
      uf: initialData?.uf || ''
    }
  });

  const clearMessages = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  const onSubmit = useCallback(async (data: ProfessorFormData) => {
    if (!user?.id) {
      setError('ID da secretaria não encontrado. Faça login novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getAPIClient();
      
      if (modoEdicao && professorId) {
        // MODO EDIÇÃO: PUT /professor/{id_professor}
        const dadosEdicao: ProfessorEditarDTO = {
          nome: data.nome.trim(),
          CPF: cleanCPF(data.cpf),
          email: data.email.trim().toLowerCase(),
          telefone: cleanPhone(data.telefone),
          logradouro: data.logradouro.trim(),
          bairro: data.bairro.trim(),
          numero: parseInt(data.numero, 10),
          cidade: data.cidade.trim(),
          UF: data.uf.toUpperCase(),
          sexo: data.sexo,
          data_nasc: data.data_nasc,
          // Senha só incluir se foi alterada
          ...(data.senha && data.senha.length > 0 ? { senha: data.senha } : {})
        };
        
        await api.put(`/professor/${professorId}`, dadosEdicao);
        setSuccessMessage('Professor atualizado com sucesso!');
      } else {
        // MODO CADASTRO: POST /professor/{id_secretaria}
        const professorDTO = transformFormToDTO(data, user.id);
        await api.post(`/professor/${user.id}`, professorDTO);
        setSuccessMessage('Professor cadastrado com sucesso!');
        form.reset();
      }
      
      onSuccess?.();
      
    } catch (err: unknown) {
      const errorMessage = handleProfessorError(err, modoEdicao ? 'EditProfessor' : 'CreateProfessor');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id, form, onSuccess, modoEdicao, professorId]);

  return {
    form,
    onSubmit,
    loading,
    error,
    successMessage,
    clearMessages,
    modoEdicao
  };
};

// ===== 2. HOOK: LISTAGEM DE PROFESSORES =====
export const useProfessorList = (): UseProfessorListReturn => {
  const [professores, setProfessores] = useState<ProfessorResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const clearError = useCallback(() => setError(null), []);

  // Função para atualização otimista (muda na tela antes da API responder)
  const updateProfessorOptimistic = useCallback((professorId: string, updates: Partial<ProfessorResponse>) => {
    setProfessores(prev => 
      prev.map(professor => 
        professor.id_professor === professorId 
          ? { ...professor, ...updates }
          : professor
      )
    );
  }, []);

  // Função para reverter se der erro
  const revertProfessorOptimistic = useCallback((professorId: string, originalData: ProfessorResponse) => {
    setProfessores(prev => 
      prev.map(professor => 
        professor.id_professor === professorId 
          ? originalData
          : professor
      )
    );
  }, []);

  const fetchProfessores = useCallback(async () => {
    if (!user?.id) {
      setError('ID da secretaria não encontrado. Faça login novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getAPIClient();
      // GET /professor/secretaria/{id_secretaria}
      const response = await api.get(`/professor/secretaria/${user.id}`);
      
      let professoresData = response.data;
      
      // Normalizar resposta (às vezes vem em array, às vezes em objeto)
      if (!Array.isArray(professoresData)) {
        if (professoresData.professores && Array.isArray(professoresData.professores)) {
          professoresData = professoresData.professores;
        } else if (professoresData.data && Array.isArray(professoresData.data)) {
          professoresData = professoresData.data;
        } else {
          professoresData = [professoresData];
        }
      }

      setProfessores(professoresData || []);
      
    } catch (err: unknown) {
      const errorMessage = handleProfessorError(err, 'FetchProfessores');
      setError(errorMessage);
      setProfessores([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refetch = useCallback(() => {
    clearError();
    fetchProfessores();
  }, [fetchProfessores, clearError]);

  useEffect(() => {
    if (user?.id) {
      fetchProfessores();
    }
  }, [user?.id, fetchProfessores]);

  return {
    professores,
    loading,
    error,
    refetch,
    clearError,
    updateProfessorOptimistic,
    revertProfessorOptimistic
  };
};

// ===== 3. HOOK: AÇÕES DE PROFESSOR =====
export const useProfessorActions = (): UseProfessorActionsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  // BUSCAR UM PROFESSOR ESPECÍFICO
  const buscarProfessor = useCallback(async (professorId: string): Promise<ProfessorResponse | null> => {
    if (!professorId) {
      setError('ID do professor é obrigatório');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getAPIClient();
      // GET /professor/{id_professor}
      const response = await api.get(`/professor/${professorId}`);
      return response.data;
    } catch (err: unknown) {
      const errorMessage = handleProfessorError(err, 'BuscarProfessor');
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // EDITAR PROFESSOR
  const editarProfessor = useCallback(async (professorId: string, dados: ProfessorEditarDTO): Promise<void> => {
    if (!professorId) {
      setError('ID do professor é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getAPIClient();
      // PUT /professor/{id_professor}
      await api.put(`/professor/${professorId}`, dados);
      setSuccessMessage('Professor atualizado com sucesso!');
    } catch (err: unknown) {
      const errorMessage = handleProfessorError(err, 'EditarProfessor');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ALTERAR SITUAÇÃO (ATIVAR/INATIVAR)
  const updateSituacao = useCallback(async (professorId: string, situacao: SituacaoType): Promise<void> => {
    if (!professorId) {
      setError('ID do professor é obrigatório');
      return;
    }

    if (!['ATIVO', 'INATIVO'].includes(situacao)) {
      setError('Situação deve ser ATIVO ou INATIVO');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getAPIClient();
      // PUT /professor/{id_professor} com apenas a situação
      await api.put(`/professor/${professorId}`, { situacao });
      setSuccessMessage(`Professor ${situacao.toLowerCase()} com sucesso!`);
    } catch (err: unknown) {
      const errorMessage = handleProfessorError(err, 'UpdateSituacao');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // DELETAR/INATIVAR PROFESSOR
  const deleteProfessor = useCallback(async (professorId: string): Promise<void> => {
    if (!professorId) {
      setError('ID do professor é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const api = getAPIClient();
      // DELETE /professor/{id_professor}/situacao
      await api.delete(`/professor/${professorId}/situacao`);
      setSuccessMessage('Professor inativado com sucesso!');
    } catch (err: unknown) {
      const errorMessage = handleProfessorError(err, 'DeleteProfessor');
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateSituacao,
    deleteProfessor,
    editarProfessor,
    buscarProfessor,
    loading,
    error,
    successMessage,
    clearMessages
  };
};

// ===== TIPOS EXPORTADOS =====
export type { 
  ProfessorResponse, 
  ProfessorFormProps, 
  UseProfessorFormReturn, 
  UseProfessorListReturn,
  UseProfessorActionsReturn
};