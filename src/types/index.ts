

// ===== INTERFACES PRINCIPAIS =====
export interface User {
  id: string;
  email: string;
  role: string;
}

//  secretaria
export interface SecretariaData {
  nome: string;
  email: string;
  id_secretaria: string;
}

// =====  UI =====
export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export interface SuccessMessageProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// =====  COMPONENTS =====
export interface HeaderProps {
  title?: string;
  subtitle?: string;
  secretariaData?: SecretariaData | null;
  user: User;
  onSignOut: () => void;
  showSignOutButton?: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export interface SidebarProps {
  className?: string;
  onMenuItemClick?: (itemId: string) => void;
}

// ===== API & HOOKS =====
export interface ApiError {
  message: string;
  status?: number;
}

export interface ApiResponse<T = Record<string, unknown>> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface UseSecretariaDataReturn {
  secretariaData: SecretariaData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ===== UTILITY TYPES =====
export type Role = 'ROLE_SECRETARIA' | 'ROLE_PROFESSOR' | 'ROLE_ALUNO';
export type Status = 'ATIVO' | 'INATIVO';
export type Sexo = 'M' | 'F';

export type { 
  ProfessorFormData, 
  ProfessorDTO, 
  CursoFormData, 
  CursoDTO, 
  CursoResponse,
  LoginFormData,
  ResetPasswordFormData
} from '@/schemas';