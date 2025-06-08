// src/hooks/secretaria/turma/index.ts
// HOOKS COMPLETOS: FORMULÁRIO, LISTAGEM E BUSCA INTELIGENTE

// ===== HOOK DE FORMULÁRIO =====
export { useTurmaForm } from './useTurmaForm';
export type { 
  TurmaFormProps, 
  UseTurmaFormReturn 
} from './useTurmaForm';

// ===== HOOK DE LISTAGEM =====
export { useTurmaList } from './useTurmaList';
export type {
  UseTurmaListReturn
} from './useTurmaList';

// ===== HOOK DE BUSCA INTELIGENTE =====
export { useTurmaSearchSmart } from './useTurmaSearchSmart';
export type {
  TurmaEncontrada,
  UseTurmaSearchSmartReturn
} from './useTurmaSearchSmart';