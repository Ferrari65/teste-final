// src/components/secretaria/home/turma/BuscarTurma.tsx - SEM LOGS DESNECESSÁRIOS

'use client';

import React from 'react';
import { useTurmaSearch } from '@/hooks/secretaria/turma';
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function BuscarTurma() {
  const {
    searchId,
    setSearchId,
    turma,
    loading,
    error,
    handleSearch,
    handleClear,
    clearError,
  } = useTurmaSearch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Busca */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="search-turma" className="block text-sm font-medium text-gray-700 mb-2">
              ID da Turma
            </label>
            <input
              id="search-turma"
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Digite o ID da turma..."
              disabled={loading}
            />
          </div>
          
          <div className="flex items-end space-x-2">
            <button
              type="submit"
              disabled={loading || !searchId.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Buscando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Buscar
                </>
              )}
            </button>
            
            {(turma || error) && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Mensagem de Erro */}
      {error && (
        <ErrorMessage 
          message={error}
          onRetry={() => {
            clearError();
            if (searchId.trim()) {
              handleSearch();
            }
          }}
        />
      )}

      {/* Resultado da Busca */}
      {turma && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Turma encontrada!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Informações da turma ID: {turma.idTurma}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Informações Básicas
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">ID da Turma:</span>
                    <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                      {turma.idTurma}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Nome:</span>
                    <span className="text-sm text-gray-900 font-medium">
                      {turma.nome}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Ano:</span>
                    <span className="text-sm text-gray-900">
                      {turma.ano}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">ID do Curso:</span>
                    <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                      {turma.idCurso}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">ID da Secretaria:</span>
                    <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                      {turma.idSecretaria}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alunos da Turma */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Alunos da Turma
                </h4>
                
                {turma.alunos && turma.alunos.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 mb-3">
                      Total: <span className="font-medium text-gray-900">{turma.alunos.length}</span> aluno(s)
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {turma.alunos.map((aluno, index) => (
                        <div key={aluno.idAluno} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {aluno.nome}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                Matrícula: {aluno.matricula}
                              </p>
                              <p className="text-xs text-gray-600">
                                Email: {aluno.email}
                              </p>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              aluno.situacao === 'ATIVO' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {aluno.situacao}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">Nenhum aluno matriculado nesta turma</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {!loading && !turma && !error && searchId.trim() === '' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Buscar Turma por ID
          </h3>
          <p className="text-gray-600">
            Digite o ID da turma no campo acima e clique em "Buscar" para visualizar suas informações detalhadas.
          </p>
        </div>
      )}
    </div>
  );
}