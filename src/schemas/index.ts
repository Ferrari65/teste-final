// src/schemas/index.ts - VERSÃO CORRIGIDA

import { z } from 'zod';

// ===== VALIDADORES BASE =====
const validateCPF = (cpf: string): boolean => {
  if (!cpf) return false;
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cleanCPF.charAt(10));
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[^\d]/g, '');
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;
  const areaCode = parseInt(cleanPhone.substring(0, 2));
  if (areaCode < 11 || areaCode > 99) return false;
  if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') return false;
  return true;
};

// ===== SCHEMAS BASE REUTILIZÁVEIS =====
export const emailValidator = z
  .string()
  .trim()
  .min(1, 'Email é obrigatório')
  .email('Digite um email válido')
  .max(254, 'Email muito longo')
  .toLowerCase();

export const passwordValidator = z
  .string()
  .min(1, 'Senha é obrigatória')
  .min(6, 'Senha deve ter pelo menos 6 caracteres')
  .max(50, 'Senha muito longa');

export const cpfValidator = z
  .string()
  .min(1, 'CPF é obrigatório')
  .refine(validateCPF, 'CPF inválido');

export const phoneValidator = z
  .string()
  .min(1, 'Telefone é obrigatório')
  .refine(validatePhone, 'Telefone inválido');

export const nameValidator = z
  .string()
  .min(1, 'Nome é obrigatório')
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome muito longo')
  .trim();

// ===== SCHEMAS DE AUTENTICAÇÃO =====
export const loginSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
});

export const resetPasswordSchema = z
  .object({
    email: emailValidator,
    password: passwordValidator,
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

// ===== SCHEMAS DE PROFESSOR =====
export const professorFormSchema = z.object({
  nome: nameValidator,
  cpf: cpfValidator,
  email: emailValidator,
  senha: passwordValidator,
  telefone: phoneValidator,
  data_nasc: z.string().min(1, 'Data de nascimento é obrigatória'),
  sexo: z.enum(['M', 'F'], {
    errorMap: () => ({ message: 'Selecione o sexo' }),
  }),
  logradouro: z.string().min(1, 'Logradouro é obrigatório').trim(),
  bairro: z.string().min(1, 'Bairro é obrigatório').trim(),
  numero: z.string().min(1, 'Número é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória').trim(),
  uf: z.string().length(2, 'UF deve ter 2 caracteres').toUpperCase(),
});

export const professorDTOSchema = z.object({
  nome: z.string(),
  CPF: z.string(),
  email: z.string(),
  senha: z.string(),
  telefone: z.string(),
  data_nasc: z.string(),
  sexo: z.enum(['M', 'F']),
  logradouro: z.string(),
  bairro: z.string(),
  numero: z.number().positive('Número deve ser positivo'),
  cidade: z.string(),
  UF: z.string(),
  situacao: z.literal('ATIVO'),
  id_secretaria: z.string(),
});

// ===== SCHEMAS DE CURSO - REMOVIDO TURNO =====
export const cursoFormSchema = z.object({
  nome: nameValidator,
  duracao: z
    .union([
      z.string().min(1, 'Duração é obrigatória'),
      z.number().min(1).max(60),
    ])
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(num) || num < 1 || num > 60) {
        throw new Error('Duração deve ser um número entre 1 e 60 meses');
      }
      return num;
    }),
  // ❌ REMOVIDO: turno não faz parte do curso
});

export const cursoDTOSchema = z.object({
  nome: z.string(),
  duracao: z.number().positive('Duração deve ser positiva'),
  // ❌ REMOVIDO: turno
  id_secretaria: z.number().positive(),
});

export const cursoResponseSchema = z.object({
  id_curso: z.number(),
  nome: z.string(),
  duracao: z.number(),
  // ❌ REMOVIDO: turno
  id_secretaria: z.number(),
  situacao: z.enum(['ATIVO', 'INATIVO']).optional(),
});

// ===== SCHEMAS DE TURMA - SIMPLIFICADO =====
export const turmaFormSchema = z.object({
  nome: nameValidator.refine(
    (name) => name.length >= 3 && name.length <= 100,
    'Nome da turma deve ter entre 3 e 100 caracteres'
  ),
  id_curso: z.string().min(1, 'Curso é obrigatório'),
  ano: z
    .string()
    .min(1, 'Ano é obrigatório')
    .regex(/^\d{4}$/, 'Ano deve ter 4 dígitos'),
  turno: z.enum(['DIURNO', 'NOTURNO'], {
    errorMap: () => ({ message: 'Selecione o turno' }),
  }),
});

// ✅ DTO SIMPLIFICADO - APENAS OS 3 CAMPOS OBRIGATÓRIOS
export const turmaDTOSchema = z.object({
  nome: z.string(),
  ano: z.string(),
  turno: z.enum(['DIURNO', 'NOTURNO']),
});

export const turmaResponseSchema = z.object({
  idTurma: z.string(),
  nome: z.string(),
  ano: z.string(),
  idCurso: z.string(),
  idSecretaria: z.string(),
  alunos: z.array(z.object({
    idAluno: z.string(),
    nome: z.string(),
    matricula: z.string(),
    email: z.string(),
    situacao: z.string(),
  })),
});

// ===== TIPOS DERIVADOS =====
export type LoginFormData = z.infer<typeof loginSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfessorFormData = z.infer<typeof professorFormSchema>;
export type ProfessorDTO = z.infer<typeof professorDTOSchema>;
export type CursoFormData = z.infer<typeof cursoFormSchema>;
export type CursoDTO = z.infer<typeof cursoDTOSchema>;
export type CursoResponse = z.infer<typeof cursoResponseSchema>;
export type TurmaFormData = z.infer<typeof turmaFormSchema>;
export type TurmaDTO = z.infer<typeof turmaDTOSchema>;
export type TurmaResponse = z.infer<typeof turmaResponseSchema>;

// ===== FUNÇÕES DE VALIDAÇÃO =====
export const validateLoginForm = (data: unknown) => loginSchema.safeParse(data);
export const validateProfessorForm = (data: unknown) => professorFormSchema.safeParse(data);
export const validateCursoForm = (data: unknown) => cursoFormSchema.safeParse(data);
export const validateCursoDTO = (data: unknown) => cursoDTOSchema.safeParse(data);
export const validateTurmaForm = (data: unknown) => turmaFormSchema.safeParse(data);
export const validateTurmaDTO = (data: unknown) => turmaDTOSchema.safeParse(data);

// ===== UTILITÁRIOS DE FORMATAÇÃO =====
export const cleanCPF = (cpf: string): string => cpf.replace(/[^\d]/g, '');
export const cleanPhone = (phone: string): string => phone.replace(/[^\d]/g, '');

export const formatCPF = (cpf: string): string => {
  const clean = cleanCPF(cpf);
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatPhone = (phone: string): string => {
  const clean = cleanPhone(phone);
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};

// ===== VALIDADORES DE DOMÍNIO =====
export const isValidCPF = validateCPF;
export const isValidPhone = validatePhone;
export const isValidEmail = (email: string): boolean => emailValidator.safeParse(email).success;
export const isValidPassword = (password: string): boolean => passwordValidator.safeParse(password).success;