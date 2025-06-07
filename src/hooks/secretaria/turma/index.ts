// src/hooks/secretaria/turma/index.ts
// Este arquivo organiza todos os hooks relacionados a turmas

// ===== HOOK PRINCIPAL DE FORMULÁRIO (sem alterações) =====
export { useTurmaForm } from './useTurmaForm';
export type { TurmaFormProps, UseTurmaFormReturn } from './useTurmaForm';

// ===== NOVO HOOK DE BUSCA COM FILTROS =====
export { 
  useTurmaSearch,
  useTurmaQuickSearch 
} from '../../../components/secretaria/home/turma/useTurmaSearch';

export type { 
  FiltrosBusca,
  ResultadoBusca,
  UseTurmaSearchReturn,
  UseTurmaQuickSearchReturn
} from './useTurmaList';

// ===== HOOK DE LISTAGEM COM PAGINAÇÃO =====
export { 
  useTurmaList,
  useTurmaActions 
} from './useTurmaListagem';

export type { 
  UseTurmaListReturn,
  TurmaListResponse
} from './useTurmaList';