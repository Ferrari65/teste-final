'use client';

import React, { useContext, useCallback } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { useSecretariaData } from '@/hooks/shared';
import UFEMSidebar from '@/components/secretaria/UFEMSidebar';
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Header from '@/components/secretaria/header';
import CadastroTurma from '@/components/secretaria/home/turma/CadastroTurma';

export default function SecretariaTurmasPage(): React.JSX.Element {
  const { user, signOut } = useContext(AuthContext);
  const { secretariaData, loading, error } = useSecretariaData();

  const handleMenuClick = useCallback((itemId: string): void => {
    console.log('Menu clicado:', itemId);
  }, []);

  const handleSignOut = useCallback((): void => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      signOut();
    }
  }, [signOut]);

  const handleTurmaSuccess = useCallback(() => {
    console.log('Turma cadastrada com sucesso!');
    // Aqui você pode adicionar lógica após o sucesso
  }, []);

  // Loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <UFEMSidebar 
        onMenuItemClick={handleMenuClick}
        className="fixed left-0 top-0 z-40"
      />
      
      <main className="flex-1 ml-64 p-8" role="main">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <Header 
            title="Gerenciamento de Turmas"
            subtitle="Bem-vindo(a),"
            secretariaData={secretariaData}
            user={user}
            onSignOut={handleSignOut}
          />

          {/* Componente de Cadastro de Turmas */}
          <CadastroTurma onSuccess={handleTurmaSuccess} />
          
        </div>
      </main>
    </div>
  );
}