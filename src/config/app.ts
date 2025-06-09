export const AUTH_CONFIG = {
  // Token storage
  tokenCookieName: 'nextauth.token',
  tokenLocalStorageKey: 'nextauth.token', 
  secretariaIdKey: 'secretaria_id',
  maxAge: 604800, 

  
  loginEndpoints: [
    '/secretaria/auth/login',
    '/professor/auth/login'
  ],

  dashboardRoutes: {
    ROLE_SECRETARIA: '/secretaria/alunos', 
    ROLE_PROFESSOR: '/professor/home'
   
  }
} as const;