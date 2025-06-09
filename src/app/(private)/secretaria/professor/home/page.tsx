'use client';

import React, { useContext, useCallback } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { useSecretariaData } from '@/hooks/shared';
import UFEMSidebar from '@/components/secretaria/UFEMSidebar';
import CadastroProfessor from '@/components/secretaria/home/professor/CadastroProfessor';
import ListaProfessor from '@/components/secretaria/home/professor/ListaProf';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Header from '@/components/secretaria/header';

export default function SecretariaProfessorPage(): React.JSX.Element {
  const { user, signOut } = useContext(AuthContext);
  const { secretariaData, error } = useSecretariaData();

  const handleMenuClick = useCallback((itemId: string): void => {
    // Callback opcional para menu
  }, []);

  const handleSignOut = useCallback((): void => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      signOut();
    }
  }, [signOut]);

  const handleProfessorSuccess = useCallback(() => {
    // Callback de sucesso
  }, []);

  // Se não tem usuário, não renderizar
  if (!user) {
    return <div></div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <UFEMSidebar 
        onMenuItemClick={handleMenuClick}
        className="fixed left-0 top-0 z-40"
      />

      <main className="flex-1 ml-64 p-8" role="main">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <Header 
            title="Gerenciamento de Professores"
            subtitle="Bem-vindo(a),"
            secretariaData={secretariaData}
            user={user}
            onSignOut={handleSignOut}
          />

          {error && (
            <ErrorMessage message={error} />
          )}
          
          <section 
            className="bg-white rounded-lg shadow-sm"
            aria-labelledby="cadastro-heading"
          >
            <header className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 
                    id="cadastro-heading"
                    className="text-xl font-semibold text-gray-900"
                  >
                    Cadastro de Professores
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Adicione novos professores ao sistema acadêmico
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 bg-green-400 rounded-full"
                    aria-hidden="true"
                  ></div>
                  <span className="text-sm text-gray-600">Online</span>
                </div>
              </div>
            </header>
            
            <div className="p-6">
              <CadastroProfessor onSuccess={handleProfessorSuccess} />
            </div>
          </section>

          <section 
            className="bg-white rounded-lg shadow-sm"
            aria-labelledby="lista-heading"
          >
            <header className="px-6 py-4 border-b border-gray-200">
              <h2 
                id="lista-heading"
                className="text-xl font-semibold text-gray-900"
              >
                Professores Cadastrados
              </h2>
              <p className="text-gray-600 mt-1">
                Lista de todos os professores no sistema
              </p>
            </header>
            
            <div className="p-6">
              <ListaProfessor />
            </div>
          </section>
          
        </div>
      </main>
    </div>
  );
}