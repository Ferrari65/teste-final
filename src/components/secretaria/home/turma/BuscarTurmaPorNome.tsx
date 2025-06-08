// src/components/secretaria/home/turma/BuscarTurmaPorNome.tsx
// BUSCA AMIGÁVEL: USUÁRIO DIGITA NOME, SISTEMA ENCONTRA A TURMA

'use client';

import React, { useState, useCallback } from 'react';
import { getAPIClient, handleApiError } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { TurmaResponse } from '@/schemas';

// ===== INTERFACES =====
interface TurmaEncontrada extends TurmaResponse {
  // Dados extras para exibição
  nomeCurso?: string;
  quantidadeAlunos: number;
}

// ===== COMPONENTE PRINCIPAL =====
export default function BuscarTurmaPorNome() {
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turmasEncontradas, setTurmasEncontradas] = useState<TurmaEncontrada[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<TurmaEncontrada | null>(null);
  const [jaFezBusca, setJaFezBusca] = useState(false);

  // Limpar erro
  const clearError = useCallback(() => setError(null), []);

  // Função para buscar turmas por nome
  const buscarTurmasPorNome = useCallback(async (nome: string): Promise<void> => {
    if (!nome || nome.trim().length < 2) {
      setError('Digite pelo menos 2 caracteres para buscar');
      return;
    }

    setLoading(true);
    setError(null);
    setTurmasEncontradas([]);
    setJaFezBusca(true);

    try {
      const api = getAPIClient();
      
      // ESTRATÉGIA 1: Tentar buscar todas as turmas e filtrar por nome
      const endpointsListagem = [
        '/turma/listar',           // Todas as turmas
        '/turma/todas',            // Todas as turmas
        '/turmas',                 // Todas as turmas
        '/api/turma/todas',        // Com prefixo API
      ];

      let todasTurmas: any[] = [];
      let conseguiuBuscar = false;

      // Tentar buscar lista completa de turmas
      for (const endpoint of endpointsListagem) {
        try {
          const response = await api.get(endpoint);
          
          if (response.data) {
            let dados = response.data;
            
            // Normalizar resposta
            if (!Array.isArray(dados)) {
              if (dados.turmas) dados = dados.turmas;
              else if (dados.data) dados = dados.data;
              else if (dados.content) dados = dados.content;
              else dados = [dados];
            }

            if (Array.isArray(dados) && dados.length > 0) {
              todasTurmas = dados;
              conseguiuBuscar = true;
              break;
            }
          }
        } catch {
          continue;
        }
      }

      // ESTRATÉGIA 2: Se não conseguiu buscar todas, tentar endpoint de busca específico
      if (!conseguiuBuscar) {
        try {
          // Tentar endpoint que pode aceitar parâmetros de busca
          const response = await api.get(`/turma/buscar`, {
            params: { nome: nome.trim() }
          });
          
          if (response.data) {
            let dados = response.data;
            if (!Array.isArray(dados)) {
              dados = dados.turmas || dados.data || [dados];
            }
            todasTurmas = dados;
            conseguiuBuscar = true;
          }
        } catch {
          // Continuar para próxima estratégia
        }
      }

      if (!conseguiuBuscar) {
        throw new Error('Não foi possível acessar a lista de turmas');
      }

      // FILTRAR TURMAS POR NOME (busca inteligente)
      const nomeParaBuscar = nome.trim().toLowerCase();
      const turmasFiltradas = todasTurmas.filter((turma: any) => {
        const nomeTurma = (turma.nome || '').toLowerCase();
        
        // Busca flexível: contém o termo ou é similar
        return nomeTurma.includes(nomeParaBuscar) || 
               nomeParaBuscar.includes(nomeTurma) ||
               nomeTurma.split(' ').some(palavra => palavra.includes(nomeParaBuscar));
      });

      // MAPEAR TURMAS ENCONTRADAS
      const turmasProcessadas: TurmaEncontrada[] = [];
      
      for (const turma of turmasFiltradas) {
        try {
          const turmaProcessada: TurmaEncontrada = {
            idTurma: String(turma.idTurma || turma.id || ''),
            nome: String(turma.nome || ''),
            ano: String(turma.ano || ''),
            idCurso: String(turma.idCurso || turma.id_curso || ''),
            idSecretaria: String(turma.idSecretaria || turma.id_secretaria || ''),
            alunos: turma.alunos || [],
            quantidadeAlunos: (turma.alunos || []).length,
            nomeCurso: turma.nomeCurso || `Curso ${turma.idCurso || 'N/A'}`
          };

          if (turmaProcessada.nome) {
            turmasProcessadas.push(turmaProcessada);
          }
        } catch {
          // Ignorar turmas com erro
        }
      }

      setTurmasEncontradas(turmasProcessadas);

      if (turmasProcessadas.length === 0) {
        setError(`Nenhuma turma encontrada com o nome "${nome}"`);
      }

    } catch (err: unknown) {
      const { message } = handleApiError(err, 'BuscarTurmas');
      setError(`Erro ao buscar turmas: ${message}`);
      setTurmasEncontradas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handler do formulário
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (termoBusca.trim()) {
      buscarTurmasPorNome(termoBusca.trim());
    }
  }, [termoBusca, buscarTurmasPorNome]);

  // Limpar busca
  const limparBusca = useCallback(() => {
    setTermoBusca('');
    setTurmasEncontradas([]);
    setTurmaSelecionada(null);
    setError(null);
    setJaFezBusca(false);
  }, []);

  // Selecionar turma para ver detalhes
  const selecionarTurma = useCallback((turma: TurmaEncontrada) => {
    setTurmaSelecionada(turma);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* ===== FORMULÁRIO DE BUSCA ===== */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Buscar Turma por Nome
            </h2>
            <p className="text-sm text-gray-600">
              Digite o nome da turma que você procura
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Turma
              </label>
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Ex: Turma ADS, Engenharia, 2025..."
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">
                Pode ser parte do nome ou nome completo
              </p>
            </div>

            <div className="flex items-end space-x-2">
              <button
                type="submit"
                disabled={loading || !termoBusca.trim()}
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
                onClick={limparBusca}
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
            if (termoBusca.trim()) {
              buscarTurmasPorNome(termoBusca.trim());
            }
          }}
        />
      )}

      {/* ===== RESULTADOS DA BUSCA ===== */}
      {jaFezBusca && !loading && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Resultados da Busca
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {turmasEncontradas.length > 0 
                    ? `${turmasEncontradas.length} turma${turmasEncontradas.length !== 1 ? 's' : ''} encontrada${turmasEncontradas.length !== 1 ? 's' : ''} com "${termoBusca}"`
                    : `Nenhuma turma encontrada com "${termoBusca}"`
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {turmasEncontradas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {turmasEncontradas.map((turma) => (
                  <div 
                    key={turma.idTurma}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => selecionarTurma(turma)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-md font-semibold text-gray-900 mb-1">
                          {turma.nome}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Ano: <span className="font-medium">{turma.ano}</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Curso:</span>
                        <span className="font-medium">{turma.nomeCurso}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Alunos:</span>
                        <span className="font-medium">
                          {turma.quantidadeAlunos} matriculado{turma.quantidadeAlunos !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button className="w-full px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-300 rounded-md hover:bg-indigo-50 transition-colors">
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma turma encontrada
                </h3>
                <p className="text-gray-600 mb-6">
                  Não encontramos nenhuma turma com o nome "{termoBusca}".
                </p>
                <button
                  onClick={limparBusca}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Nova Busca
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL DE DETALHES ===== */}
      {turmaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <label className="text-sm font-medium text-gray-600">Nome da Turma</label>
                  <p className="text-lg font-semibold text-gray-900">{turmaSelecionada.nome}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <label className="text-sm font-medium text-gray-600">Ano Letivo</label>
                  <p className="text-lg font-semibold text-gray-900">{turmaSelecionada.ano}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <label className="text-sm font-medium text-gray-600">Curso</label>
                  <p className="text-lg font-semibold text-gray-900">{turmaSelecionada.nomeCurso}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <label className="text-sm font-medium text-gray-600">Alunos Matriculados</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {turmaSelecionada.quantidadeAlunos} aluno{turmaSelecionada.quantidadeAlunos !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Lista de alunos se houver */}
              {turmaSelecionada.alunos && turmaSelecionada.alunos.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    Lista de Alunos
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {turmaSelecionada.alunos.map((aluno: any, index: number) => (
                      <div 
                        key={aluno.idAluno || index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{aluno.nome}</p>
                          <p className="text-sm text-gray-600">Matrícula: {aluno.matricula}</p>
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
                </div>
              )}
            </div>

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
    </div>
  );
}