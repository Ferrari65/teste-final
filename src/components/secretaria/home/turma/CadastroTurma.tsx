// src/components/secretaria/home/turma/CadastroTurma.tsx - COM LISTA FUNCIONAL

'use client';

import React, { useCallback } from "react";
import { useTurmaForm } from "@/hooks/secretaria/turma";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SuccessMessage } from "@/components/ui/SuccessMessage";
import { TurmaDataSection } from "./TurmaDataSection";
import ListarTurmas from "./BuscarTurma"; // ✅ Novo componente de lista
import type { TurmaFormProps } from "@/hooks/secretaria/turma";

interface CadastroTurmaProps extends TurmaFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CadastroTurma({ onSuccess, onCancel }: CadastroTurmaProps) {
  const {
    form,
    onSubmit,
    loading,
    error,
    successMessage,
    clearMessages
  } = useTurmaForm({ onSuccess });

  // Handlers memoizados para melhor performance
  const handleClearMessages = useCallback((): void => {
    clearMessages();
  }, [clearMessages]);

  const handleFormSubmit = useCallback((event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    form.handleSubmit(onSubmit)(event);
  }, [form, onSubmit]);

  return (
    <div className="space-y-8">
      {/* ===== SEÇÃO: FORMULÁRIO DE CADASTRO ===== */}
      <section 
        className="bg-white rounded-lg shadow-sm border border-gray-200"
        aria-labelledby="cadastro-heading"
      >
        {/* Header do Formulário */}
        <header className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <svg 
                className="w-6 h-6 text-white" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 12.75c1.63 0 3.07.39 4.24.9c1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73c1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2c0-1.1-.9-2-2-2s-2 .9-2 2c0 1.1.9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1c-.99 0-1.93.21-2.78.58A2.01 2.01 0 0 0 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2c0-1.1-.9-2-2-2s-2 .9-2 2c0 1.1.9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85A6.95 6.95 0 0 0 20 14c-.39 0-.76.04-1.13.1c.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3c0 1.66-1.34 3-3 3s-3-1.34-3-3c0-1.66 1.34-3 3-3z" />
              </svg>
            </div>
            <div>
              <h1 
                id="cadastro-heading"
                className="text-xl font-semibold text-gray-900"
              >
                Cadastrar Nova Turma
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Preencha as informações da turma para cadastrá-la no sistema
              </p>
            </div>
          </div>
        </header>

        {/* Conteúdo do Formulário */}
        <div className="p-6">
          {/* Mensagens de Feedback */}
          <div className="space-y-4 mb-6">
            {successMessage && (
              <SuccessMessage 
                message={successMessage} 
                onClose={handleClearMessages}
              />
            )}

            {error && (
              <ErrorMessage 
                message={error}
                onRetry={handleClearMessages}
              />
            )}
          </div>

          {/* Formulário */}
          <form 
            onSubmit={handleFormSubmit}
            className="space-y-6"
            noValidate
          >
            {/* Campos do Formulário */}
            <TurmaDataSection form={form} />

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancelar
                </button>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center min-w-[120px] justify-center"
                aria-describedby={loading ? "loading-message" : undefined}
              >
                {loading ? (
                  <>
                    <svg 
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                      fill="none" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span id="loading-message">Salvando...</span>
                    <span className="sr-only">Processando cadastro da turma...</span>
                  </>
                ) : (
                  'Cadastrar Turma'
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ===== SEÇÃO: LISTAR TURMAS ===== */}
      <section 
        className="bg-white rounded-lg shadow-sm border border-gray-200"
        aria-labelledby="listar-heading"
      >
        <header className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
                />
              </svg>
            </div>
            <div>
              <h2 
                id="listar-heading"
                className="text-xl font-semibold text-gray-900"
              >
                Turmas Cadastradas
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Visualize, filtre e gerencie todas as turmas do sistema
              </p>
            </div>
          </div>
        </header>
        
        <div className="p-6">
          <ListarTurmas />
        </div>
      </section>

      {/* Loading overlay global para formulário */}
      {loading && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50"
          aria-hidden="true"
        >
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4 shadow-xl">
            <svg 
              className="animate-spin h-6 w-6 text-purple-600" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-gray-700 font-medium">
              Processando cadastro da turma...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}