// src/components/secretaria/home/professor/CadastroProfessorCompleto.tsx

'use client';

import React, { useEffect } from 'react';
import { useProfessorForm, type ProfessorResponse } from '@/hooks/secretaria/professor';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SuccessMessage } from '@/components/ui/SuccessMessage';
import { PersonalDataSection } from './DataSection';
import { AddressSection } from './AddressSection';

interface CadastroProfessorCompletoProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  professorParaEditar?: ProfessorResponse | null; // Se vier preenchido, é modo edição
  modoEdicao?: boolean;
}

export default function CadastroProfessorCompleto({ 
  onSuccess, 
  onCancel, 
  professorParaEditar,
  modoEdicao = false
}: CadastroProfessorCompletoProps) {
  
  // Se tem professor para editar, preparar os dados iniciais
  const dadosIniciais = professorParaEditar ? {
    nome: professorParaEditar.nome,
    cpf: professorParaEditar.cpf,
    email: professorParaEditar.email,
    senha: '', // Senha sempre vazia para segurança
    telefone: professorParaEditar.telefone,
    data_nasc: professorParaEditar.data_nasc,
    sexo: professorParaEditar.sexo as 'M' | 'F',
    logradouro: professorParaEditar.logradouro,
    bairro: professorParaEditar.bairro,
    numero: professorParaEditar.numero.toString(),
    cidade: professorParaEditar.cidade,
    uf: professorParaEditar.uf
  } : undefined;

  const {
    form,
    onSubmit,
    loading,
    error,
    successMessage,
    clearMessages,
    modoEdicao: isEditMode
  } = useProfessorForm({ 
    onSuccess,
    initialData: dadosIniciais,
    professorId: professorParaEditar?.id_professor
  });

  // Quando receber um professor para editar, preencher o formulário
  useEffect(() => {
    if (professorParaEditar && modoEdicao) {
      form.reset({
        nome: professorParaEditar.nome,
        cpf: professorParaEditar.cpf,
        email: professorParaEditar.email,
        senha: '', // Sempre deixar vazio
        telefone: professorParaEditar.telefone,
        data_nasc: professorParaEditar.data_nasc,
        sexo: professorParaEditar.sexo as 'M' | 'F',
        logradouro: professorParaEditar.logradouro,
        bairro: professorParaEditar.bairro,
        numero: professorParaEditar.numero.toString(),
        cidade: professorParaEditar.cidade,
        uf: professorParaEditar.uf
      });
    }
  }, [professorParaEditar, modoEdicao, form]);

  const handleCancel = () => {
    if (!isEditMode) {
      // Só limpa o formulário se não estiver editando
      form.reset({
        nome: '',
        cpf: '',
        email: '',
        senha: '',
        telefone: '',
        data_nasc: '',
        sexo: 'M',
        logradouro: '',
        bairro: '',
        numero: '',
        cidade: '',
        uf: ''
      });
    }
    clearMessages();
    onCancel?.();
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.handleSubmit(onSubmit)(event);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header do Formulário */}
      <header className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className={`w-12 h-12 ${isEditMode ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} rounded-lg flex items-center justify-center mr-4 flex-shrink-0`}>
            {isEditMode ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Editar Professor' : 'Cadastrar Novo Professor'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode 
                ? 'Atualize as informações do professor' 
                : 'Preencha as informações do professor para cadastrá-lo no sistema'
              }
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
              onClose={clearMessages}
            />
          )}

          {error && (
            <ErrorMessage 
              message={error}
              onRetry={clearMessages}
            />
          )}
        </div>

        {/* Informação sobre edição */}
        {isEditMode && professorParaEditar && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">
                  Editando: {professorParaEditar.nome}
                </h3>
                <div className="mt-2 text-sm text-orange-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Para manter a senha atual, deixe o campo senha vazio</li>
                    <li>Apenas os campos alterados serão atualizados</li>
                    <li>O CPF pode ser alterado se necessário</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulário */}
        <form 
          onSubmit={handleFormSubmit}
          className="space-y-6"
          noValidate
          aria-describedby={error ? "error-message" : undefined}
        >
          {/* Seção: Dados Pessoais */}
          <PersonalDataSection 
            form={form} 
            modoEdicao={isEditMode}
          />

          {/* Seção: Endereço */}
          <AddressSection form={form} />

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Cancelar operação"
              >
                Cancelar
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center min-w-[120px] justify-center ${
                isEditMode 
                  ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
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
                  <span id="loading-message">
                    {isEditMode ? 'Atualizando...' : 'Salvando...'}
                  </span>
                  <span className="sr-only">
                    {isEditMode ? 'Processando atualização do professor...' : 'Processando cadastro do professor...'}
                  </span>
                </>
              ) : (
                isEditMode ? 'Atualizar Professor' : 'Cadastrar Professor'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading overlay global para formulário */}
      {loading && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50"
          aria-hidden="true"
        >
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4 shadow-xl">
            <svg 
              className="animate-spin h-6 w-6 text-blue-600" 
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
              {isEditMode 
                ? 'Atualizando professor...' 
                : 'Processando cadastro do professor...'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}