// src/utils/transformers.ts - VERSÃO CORRIGIDA SEM ERROS

import {
  ProfessorFormData,
  ProfessorDTO,
  CursoFormData,
  CursoDTO,
  TurmaFormData,
  TurmaDTO,
  cleanCPF,
  cleanPhone
} from '@/schemas';

// ===== PROFESSOR (CORRIGIDO) =====
export const transformProfessorFormToDTO = (
  data: ProfessorFormData,
  secretariaId: string
): ProfessorDTO => {
  const cpfLimpo = cleanCPF(data.cpf);
  const telefoneLimpo = cleanPhone(data.telefone);
  const numeroInt = parseInt(data.numero, 10);

  if (isNaN(numeroInt) || numeroInt <= 0) {
    throw new Error('Número deve ser um valor válido maior que zero');
  }

  if (cpfLimpo.length !== 11) {
    throw new Error('CPF deve ter 11 dígitos');
  }

  if (telefoneLimpo.length !== 10 && telefoneLimpo.length !== 11) {
    throw new Error('Telefone deve ter 10 ou 11 dígitos');
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
    sexo: data.sexo.toUpperCase() as 'M' | 'F',
    telefone: telefoneLimpo,
    data_nasc: data.data_nasc,
    situacao: 'ATIVO',
    id_secretaria: secretariaId
  };
};

// ===== CURSO (CORRIGIDO PARA INCLUIR TURNO) =====
export const transformCursoFormToDTO = (
  data: CursoFormData,
  secretariaId: string
): CursoDTO => {
  let duracao: number;

  if (typeof data.duracao === 'string') {
    duracao = parseInt(data.duracao, 10);
    if (isNaN(duracao) || duracao <= 0 || duracao > 60) {
      throw new Error('Duração deve ser um número entre 1 e 60 meses');
    }
  } else {
    duracao = data.duracao;
  }

  const idSecretaria = parseInt(secretariaId, 10);
  if (isNaN(idSecretaria)) {
    throw new Error('ID da secretaria deve ser um número válido');
  }

  const turnosValidos = ['DIURNO', 'NOTURNO'];
  if (!turnosValidos.includes(data.turno)) {
    throw new Error('Turno deve ser DIURNO ou NOTURNO');
  }

  return {
    nome: data.nome.trim(),
    duracao,
    turno: data.turno, // ✅ CAMPO TURNO ADICIONADO
    id_secretaria: idSecretaria
  };
};

// ===== TURMA (CORRIGIDO PARA INCLUIR TURNO) =====
export const transformTurmaFormToDTO = (
  data: TurmaFormData
): TurmaDTO => {
  // ✅ VALIDAÇÃO DO ANO
  if (!data.ano || !/^\d{4}$/.test(data.ano)) {
    throw new Error('Ano deve ter 4 dígitos (ex: 2024)');
  }

  // ✅ VALIDAÇÃO DO NOME
  if (!data.nome || data.nome.trim() === '') {
    throw new Error('Nome da turma é obrigatório');
  }

  if (data.nome.trim().length < 3) {
    throw new Error('Nome da turma deve ter pelo menos 3 caracteres');
  }

  if (data.nome.trim().length > 100) {
    throw new Error('Nome da turma deve ter no máximo 100 caracteres');
  }

  // ✅ VALIDAÇÃO DO CURSO
  if (!data.id_curso || data.id_curso.trim() === '') {
    throw new Error('Curso é obrigatório');
  }

  const idCurso = parseInt(data.id_curso, 10);
  if (isNaN(idCurso) || idCurso <= 0) {
    throw new Error('ID do curso deve ser um número válido');
  }

  // ✅ VALIDAÇÃO DO TURNO
  if (!data.turno) {
    throw new Error('Turno é obrigatório');
  }

  const turnosValidos = ['DIURNO', 'NOTURNO'];
  if (!turnosValidos.includes(data.turno)) {
    throw new Error('Turno deve ser DIURNO ou NOTURNO');
  }

  // ✅ RETORNAR DTO CORRETO (SÓ OS CAMPOS QUE VÃO NO BODY)
  return {
    nome: data.nome.trim(),
    ano: data.ano,
    turno: data.turno // ✅ INCLUIR TURNO CONFORME SEU BACKEND
  };
};

// ===== VALIDAÇÃO AUXILIAR PARA TURMA =====
export const validateTurmaData = (
  data: TurmaFormData,
  secretariaId: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validar dados do formulário
  try {
    transformTurmaFormToDTO(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      errors.push(error.message);
    } else {
      errors.push('Erro desconhecido na validação');
    }
  }

  // Validar secretaria ID
  if (!secretariaId || secretariaId.trim() === '') {
    errors.push('ID da secretaria não encontrado');
  } else {
    const idSecretaria = parseInt(secretariaId, 10);
    if (isNaN(idSecretaria) || idSecretaria <= 0) {
      errors.push('ID da secretaria deve ser um número válido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ===== VALIDAÇÃO DE FORMULÁRIOS =====
export const validateFormData = {
  professor: (data: ProfessorFormData): string[] => {
    const errors: string[] = [];

    const requiredFields = [
      { value: data.nome?.trim(), label: 'Nome' },
      { value: data.email?.trim(), label: 'Email' },
      { value: data.senha, label: 'Senha' },
      { value: data.cpf, label: 'CPF' },
      { value: data.telefone, label: 'Telefone' },
      { value: data.data_nasc, label: 'Data de nascimento' },
      { value: data.sexo, label: 'Sexo' },
      { value: data.logradouro?.trim(), label: 'Logradouro' },
      { value: data.bairro?.trim(), label: 'Bairro' },
      { value: data.numero, label: 'Número' },
      { value: data.cidade?.trim(), label: 'Cidade' },
      { value: data.uf, label: 'UF' }
    ];

    requiredFields.forEach(({ value, label }) => {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${label} é obrigatório`);
      }
    });

    if (data.numero && isNaN(parseInt(data.numero, 10))) {
      errors.push('Número deve ser um valor numérico válido');
    }

    return errors;
  },

  curso: (data: CursoFormData): string[] => {
    const errors: string[] = [];

    if (!data.nome?.trim()) {
      errors.push('Nome do curso é obrigatório');
    } else if (data.nome.trim().length < 3) {
      errors.push('Nome do curso deve ter pelo menos 3 caracteres');
    }

    if (!data.duracao) {
      errors.push('Duração é obrigatória');
    } else {
      const duracao = typeof data.duracao === 'string' ? parseInt(data.duracao, 10) : data.duracao;
      if (isNaN(duracao) || duracao <= 0 || duracao > 60) {
        errors.push('Duração deve ser um número entre 1 e 60 meses');
      }
    }

    // ✅ VALIDAÇÃO DE TURNO ADICIONADA
    if (!data.turno) {
      errors.push('Turno é obrigatório');
    } else if (!['DIURNO', 'NOTURNO'].includes(data.turno)) {
      errors.push('Turno deve ser DIURNO ou NOTURNO');
    }

    return errors;
  },

  turma: (data: TurmaFormData): string[] => {
    const errors: string[] = [];

    // ✅ VALIDAÇÃO COMPLETA DOS CAMPOS OBRIGATÓRIOS
    const requiredFields = [
      { value: data.nome?.trim(), label: 'Nome da turma' },
      { value: data.id_curso, label: 'Curso' },
      { value: data.turno, label: 'Turno' },
      { value: data.ano, label: 'Ano' }
    ];

    requiredFields.forEach(({ value, label }) => {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${label} é obrigatório`);
      }
    });

    // ✅ VALIDAÇÃO ESPECÍFICA DO ANO
    if (data.ano && !/^\d{4}$/.test(data.ano)) {
      errors.push('Ano deve ter 4 dígitos (ex: 2024)');
    }

    // ✅ VALIDAÇÃO ESPECÍFICA DO TURNO
    if (data.turno && !['DIURNO', 'NOTURNO'].includes(data.turno)) {
      errors.push('Turno deve ser DIURNO ou NOTURNO');
    }

    return errors;
  }
};

// ===== FORMATADORES (EXPANDIDOS) =====
export const formatters = {
  cpf: (cpf: string): string => {
    const clean = cleanCPF(cpf);
    if (clean.length !== 11) return cpf;
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  phone: (phone: string): string => {
    const clean = cleanPhone(phone);
    if (clean.length === 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (clean.length === 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  },

  currency: (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  date: (date: string | Date): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR');
  },

  turno: (turno: string): string => {
    const turnos = {
      'DIURNO': 'Diurno',
      'NOTURNO': 'Noturno'
    };
    return turnos[turno as keyof typeof turnos] || turno;
  },

  ano: (ano: string): string => {
    return ano.padStart(4, '0');
  }
};

// ===== VALIDADORES AUXILIARES =====
export const validators = {
  secretariaId: (id: string): boolean => {
    const numId = parseInt(id, 10);
    return !isNaN(numId) && numId > 0;
  },

  cursoId: (id: string): boolean => {
    const numId = parseInt(id, 10);
    return !isNaN(numId) && numId > 0;
  },

  positiveInteger: (value: string | number): boolean => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    return !isNaN(num) && num > 0 && Number.isInteger(num);
  },

  uf: (uf: string): boolean => {
    const validUFs = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
      'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
      'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];
    return validUFs.includes(uf.toUpperCase());
  },

  turno: (turno: string): boolean => {
    return ['DIURNO', 'NOTURNO'].includes(turno);
  },

  ano: (ano: string): boolean => {
    return /^\d{4}$/.test(ano) && parseInt(ano) >= 1900 && parseInt(ano) <= 2100;
  }
};