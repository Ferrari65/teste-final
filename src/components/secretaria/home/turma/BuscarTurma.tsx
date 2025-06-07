// src/components/secretaria/home/turma/BuscarTurma.tsx
// Este arquivo substitui o componente antigo que buscava apenas por ID

'use client';

import React, { useState } from 'react';
import { useTurmaSearch } from '@/components/secretaria/home/turma/useTurmaSearch';
import { useCursoList } from '@/hooks/secretaria/curso';
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { TurmaResponse } from '@/schemas';

// ===== COMPONENTE PARA MOSTRAR UMA TURMA (FORMATO CARD) =====
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
          <span>Secretaria:</span>
          <span className="font-medium">ID {turma.idSecretaria}</span>
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
  // Estado para controlar como mostrar os resultados (cards ou lista)
  const [modoVisualizacao, setModoVisualizacao] = useState<'cards' | 'lista'>('cards');
  
  // Estado para quando o usuário clica em "Ver Detalhes"
  const [turmaSelecionada, setTurmaSelecionada] = useState<TurmaResponse | null>(null);

  // Hook customizado para busca de turmas
  const {
    filtros,           // Filtros atuais
    resultados,        // Turmas encontradas
    loading,           // Se está carregando
    error,             // Se deu erro
    totalEncontradas,  // Quantas turmas foram encontradas
    atualizarFiltro,   // Função para atualizar um filtro
    buscar,            // Função para fazer a busca
    limparBusca,       // Função para limpar resultados
    limparFiltros,     // Função para limpar tudo
    clearError,        // Função para limpar erro
  } = useTurmaSearch();

  // Hook para carregar lista de cursos (para o dropdown)
  const { cursos, loading: cursosLoading } = useCursoList();

  // ===== FUNÇÕES DE CONTROLE =====
  
  // Quando o usuário submete o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Impede o reload da página
    buscar(); // Faz a busca
  };

  // Quando o usuário clica em "Limpar Tudo"
  const handleLimparTudo = () => {
    limparFiltros(); // Limpa filtros e resultados
    setTurmaSelecionada(null); // Remove turma selecionada
  };

  // Quando o usuário clica em "Ver Detalhes" de uma turma
  const handleViewDetails = (turma: TurmaResponse) => {
    setTurmaSelecionada(turma);
  };

  // Filtrar apenas cursos ativos e válidos
  const cursosValidos = cursos.filter(curso => 
    curso.idCurso && curso.nome && curso.situacao === 'ATIVO'
  );

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
              Use os filtros abaixo para encontrar turmas específicas
            </p>
          </div>
        </div>

        {/* Formulário com os campos de filtro */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Campo: Nome da Turma */}
            <div>
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

            {/* Campo: Curso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Curso
              </label>
              <select
                value={filtros.curso || ''}
                onChange={(e) => atualizarFiltro('curso', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                disabled={loading || cursosLoading}
              >
                <option value="">Todos os cursos</option>
                {cursosValidos.map((curso) => (
                  <option key={curso.idCurso} value={curso.idCurso}>
                    {curso.nome}
                  </option>
                ))}
              </select>
              {cursosLoading && (
                <p className="text-xs text-gray-500 mt-1">Carregando cursos...</p>
              )}
            </div>

            {/* Campo: Ano */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ano Letivo
              </label>
              <input
                type="text"
                value={filtros.ano || ''}
                onChange={(e) => atualizarFiltro('ano', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Ex: 2024"
                maxLength={4}
                pattern="\d{4}"
                disabled={loading}
              />
            </div>

            {/* Campo: Turno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turno
              </label>
              <select
                value={filtros.turno || ''}
                onChange={(e) => atualizarFiltro('turno', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                disabled={loading}
              >
                <option value="">Todos os turnos</option>
                <option value="DIURNO">🌅 Diurno</option>
                <option value="NOTURNO">🌙 Noturno</option>
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {/* Mostrar quantos filtros estão ativos */}
              {Object.values(filtros).filter(v => v && v.toString().trim() !== '').length > 0 && (
                <span className="text-sm text-gray-600">
                  {Object.values(filtros).filter(v => v && v.toString().trim() !== '').length} filtro(s) ativo(s)
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Botão Limpar */}
              <button
                type="button"
                onClick={handleLimparTudo}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Limpar Tudo
              </button>
              
              {/* Botão Buscar */}
              <button
                type="submit"
                disabled={loading}
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
                    Buscar Turmas
                  </>
                )}
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
      {(resultados.length > 0 || (!loading && totalEncontradas === 0 && Object.values(filtros).some(v => v))) && (
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
                    ? `${totalEncontradas} turma${totalEncontradas !== 1 ? 's' : ''} encontrada${totalEncontradas !== 1 ? 's' : ''}`
                    : 'Nenhuma turma encontrada com os filtros especificados'
                  }
                </p>
              </div>
              
              {/* Controles de Visualização */}
              {resultados.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Visualizar como:</span>
                  <div className="flex border border-gray-300 rounded-md overflow-hidden">
                    {/* Botão para visualização em cards */}
                    <button
                      onClick={() => setModoVisualizacao('cards')}
                      className={`px-3 py-1 text-sm transition-colors ${
                        modoVisualizacao === 'cards'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </button>
                    {/* Botão para visualização em lista */}
                    <button
                      onClick={() => setModoVisualizacao('lista')}
                      className={`px-3 py-1 text-sm transition-colors ${
                        modoVisualizacao === 'lista'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conteúdo dos Resultados */}
          <div className="p-6">
            {resultados.length > 0 ? (
              modoVisualizacao === 'cards' ? (
                /* Visualização em Cards (como cartões) */
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
                /* Visualização em Lista/Tabela */
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome da Turma
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ano
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Curso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Alunos
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resultados.map((turma) => (
                        <tr key={turma.idTurma} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <svg className="h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12.75c1.63 0 3.07.39 4.24.9c1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73c1.17-.52 2.61-.91 4.24-.91z M4 13c1.1 0 2-.9 2-2c0-1.1-.9-2-2-2s-2 .9-2 2c0 1.1.9 2 2 2z M12 6c1.66 0 3 1.34 3 3c0 1.66-1.34 3-3 3s-3-1.34-3-3c0-1.66 1.34-3 3-3z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {turma.nome}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {turma.idTurma}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {turma.ano}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ID {turma.idCurso}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {turma.alunos?.length || 0} aluno(s)
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(turma)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            >
                              Ver Detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
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
                  Tente ajustar os filtros ou criar uma nova busca.
                </p>
                <button
                  onClick={handleLimparTudo}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Limpar Filtros
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
       !Object.values(filtros).some(v => v && v.toString().trim() !== '') && (
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
            Preencha os filtros acima e clique em "Buscar Turmas" para encontrar as turmas que você procura.
          </p>
        </div>
      )}
    </div>
  );
}