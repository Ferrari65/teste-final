// src/hooks/secretaria/turma/index.ts
// CENTRALIZADOR DOS HOOKS DE TURMA - ORGANIZADO E SIMPLES

// ===== HOOK DE FORMULÁRIO =====
export { useTurmaForm } from './useTurmaForm';
export type { 
  TurmaFormProps, 
  UseTurmaFormReturn 
} from './useTurmaForm';

// ===== HOOK DE BUSCA =====
export { useTurmaSearch } from './useTurmaSearch';
export type { 
  FiltrosBusca,
  UseTurmaSearchReturn
} from './useTurmaSearch';