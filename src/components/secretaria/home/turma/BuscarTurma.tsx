// src/components/secretaria/home/turma/BuscarTurma.tsx
// COMPONENTE SIMPLES PARA BUSCAR TURMAS APENAS POR NOME

'use client';

import React, { useState } from 'react';
import { useTurmaSearch } from '@/hooks/secretaria/turma';
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { TurmaResponse } from '@/schemas';

// ===== COMPONENTE PARA MOSTRAR UMA TURMA =====
interface TurmaCardProps {
  turma: TurmaResponse;
  onViewDetails?: (turma: TurmaResponse) => void;
}

const TurmaCard: React.FC<TurmaCardProps> = ({ turma, onViewDetails }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header do Card */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {turma.nome}
          </h3>
          <p className="text-sm text-gray-600">
            Ano: <span className="font-medium">{turma.ano}</span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            ID: {turma.idTurma}
          </span>
        </div>
      </div>

      {/* Informações da Turma */}
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Curso:</span>
          <span className="font-medium">ID {turma.idCurso}</span>
        </div>
        <div className="flex justify-between">
          <span>Alunos:</span>
          <span className="font-medium">
            {turma.alunos?.length || 0} matriculado(s)
          </span>
        </div>
      </div>

      {/* Lista de Alunos (se houver) */}
      {turma.alunos && turma.alunos.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Alguns alunos:</p>
          <div className="flex flex-wrap gap-1">
            {turma.alunos.slice(0, 3).map((aluno) => (
              <span 
                key={aluno.idAluno}
                className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {aluno.nome.split(' ')[0]}
              </span>
            ))}
            {turma.alunos.length > 3 && (
              <span className="inline-flex px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                +{turma.alunos.length - 3} mais
              </span>
            )}
          </div>
        </div>
      )}

      {/* Botão para ver detalhes */}
      {onViewDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => onViewDetails(turma)}
            className="w-full px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
          >
            Ver Detalhes
          </button>
        </div>
      )}
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
export default function BuscarTurma() {
  const [turmaSelecionada, setTurmaSelecionada] = useState<TurmaResponse | null>(null);

  // Hook de busca
  const {
    filtros,
    resultados,
    loading,
    error,
    totalEncontradas,
    atualizarFiltro,
    buscar,
    limparBusca,
    limparFiltros,
    clearError,
  } = useTurmaSearch();

  // Quando o usuário submete o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    buscar();
  };

  // Quando o usuário clica em "Limpar Tudo"
  const handleLimparTudo = () => {
    limparFiltros();
    setTurmaSelecionada(null);
  };

  // Quando o usuário clica em "Ver Detalhes"
  const handleViewDetails = (turma: TurmaResponse) => {
    setTurmaSelecionada(turma);
  };

  return (
    <div className="space-y-6">
      
      {/* ===== FORMULÁRIO DE BUSCA ===== */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        
        {/* Header do formulário */}
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Buscar Turmas
            </h2>
            <p className="text-sm text-gray-600">
              Digite o nome da turma para encontrá-la
            </p>
          </div>
        </div>

        {/* Formulário simples */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            {/* Campo: Nome da Turma */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Turma
              </label>
              <input
                type="text"
                value={filtros.nome || ''}
                onChange={(e) => atualizarFiltro('nome', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Ex: Turma ADS 2024"
                disabled={loading}
              />
            </div>

            {/* Botões */}
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                disabled={loading || !filtros.nome?.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
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
              
              <button
                type="button"
                onClick={handleLimparTudo}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Limpar
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ===== MENSAGEM DE ERRO ===== */}
      {error && (
        <ErrorMessage 
          message={error}
          onRetry={() => {
            clearError();
            buscar();
          }}
        />
      )}

      {/* ===== ÁREA DE RESULTADOS ===== */}
      {(resultados.length > 0 || (!loading && totalEncontradas === 0 && filtros.nome)) && (
        <div className="bg-white border border-gray-200 rounded-lg">
          
          {/* Header dos Resultados */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Resultados da Busca
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {totalEncontradas > 0 
                    ? `${totalEncontradas} turma${totalEncontradas !== 1 ? 's' : ''} encontrada${totalEncontradas !== 1 ? 's' : ''} com "${filtros.nome}"`
                    : `Nenhuma turma encontrada com "${filtros.nome}"`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo dos Resultados */}
          <div className="p-6">
            {resultados.length > 0 ? (
              /* Visualização em Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resultados.map((turma) => (
                  <TurmaCard 
                    key={turma.idTurma} 
                    turma={turma} 
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              /* Mensagem quando não há resultados */
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma turma encontrada
                </h3>
                <p className="text-gray-600 mb-6">
                  Não encontramos nenhuma turma com o nome "{filtros.nome}".
                </p>
                <button
                  onClick={handleLimparTudo}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Nova Busca
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL DE DETALHES DA TURMA ===== */}
      {turmaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Header do Modal */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalhes da Turma
              </h3>
              <button
                onClick={() => setTurmaSelecionada(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6">
              <div className="space-y-6">
                
                {/* Informações Básicas */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    Informações Básicas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <label className="text-sm font-medium text-gray-600">Nome da Turma</label>
                      <p className="text-lg font-semibold text-gray-900">{turmaSelecionada.nome}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <label className="text-sm font-medium text-gray-600">Ano Letivo</label>
                      <p className="text-lg font-semibold text-gray-900">{turmaSelecionada.ano}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <label className="text-sm font-medium text-gray-600">ID da Turma</label>
                      <p className="text-lg font-semibold text-gray-900">{turmaSelecionada.idTurma}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <label className="text-sm font-medium text-gray-600">ID do Curso</label>
                      <p className="text-lg font-semibold text-gray-900">{turmaSelecionada.idCurso}</p>
                    </div>
                  </div>
                </div>

                {/* Lista de Alunos */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    Alunos Matriculados ({turmaSelecionada.alunos?.length || 0})
                  </h4>
                  
                  {turmaSelecionada.alunos && turmaSelecionada.alunos.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {turmaSelecionada.alunos.map((aluno) => (
                        <div 
                          key={aluno.idAluno} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{aluno.nome}</p>
                            <p className="text-sm text-gray-600">
                              Matrícula: {aluno.matricula} • Email: {aluno.email}
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
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-md">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-500">Nenhum aluno matriculado nesta turma</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setTurmaSelecionada(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ESTADO VAZIO (quando não há busca ainda) ===== */}
      {!loading && resultados.length === 0 && totalEncontradas === 0 && 
       (!filtros.nome || filtros.nome.trim() === '') && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Pronto para buscar turmas!
          </h3>
          <p className="text-gray-600">
            Digite o nome da turma acima e clique em "Buscar" para encontrar as turmas que você procura.
          </p>
        </div>
      )}
    </div>
  );
}