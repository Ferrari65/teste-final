// src/components/secretaria/home/turma/TurmaDataSection.tsx - VERSÃO COMPLETA SEM DEBUG

'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useCursoList } from '@/hooks/secretaria/curso';
import type { TurmaFormData } from '@/schemas';

interface TurmaDataSectionProps {
  form: UseFormReturn<TurmaFormData>;
}

export const TurmaDataSection: React.FC<TurmaDataSectionProps> = ({ form }) => {
  const { register, formState: { errors }, watch } = form;
  
  // Hook de cursos com tratamento de erro aprimorado
  const { cursos, loading: cursosLoading, error: cursosError, refetch, clearError } = useCursoList();
  
  // Observa os valores selecionados
  const cursoSelecionado = watch('id_curso');
  const turnoSelecionado = watch('turno');
  const nomeValue = watch('nome');
  const anoValue = watch('ano');
  
  // Filtro defensivo e validação de cursos
  const cursosValidos = cursos.filter((curso) => {
    if (!curso) return false;
    
    const hasValidId = curso.id_curso !== undefined && 
                      curso.id_curso !== null && 
                      (typeof curso.id_curso === 'number' || 
                       (typeof curso.id_curso === 'string' && !isNaN(parseInt(curso.id_curso, 10))));
    
    const hasValidNome = curso.nome && typeof curso.nome === 'string' && curso.nome.trim() !== '';
    const hasValidDuracao = curso.duracao && typeof curso.duracao === 'number' && curso.duracao > 0;
    
    return hasValidId && hasValidNome && hasValidDuracao;
  });

  // Buscar curso selecionado
  const cursoDetalhes = cursosValidos.find(curso => 
    String(curso.id_curso) === String(cursoSelecionado)
  );

  // Handler para recarregar cursos
  const handleReloadCursos = () => {
    if (clearError) clearError();
    refetch();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-700 mb-4">Dados da Turma</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Nome da Turma */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Nome da Turma
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            {...register('nome')}
            className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 transition-colors ${
              errors.nome 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
            }`}
            placeholder="Ex: Turma ADS 2024-1"
            autoComplete="off"
          />
          {errors.nome && (
            <span className="text-sm text-red-600">{errors.nome.message}</span>
          )}
          <span className="text-xs text-gray-500">Mínimo 3 caracteres, máximo 100</span>
        </div>

        {/* Ano */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Ano Letivo
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            {...register('ano')}
            className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 transition-colors ${
              errors.ano 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
            }`}
            placeholder="Ex: 2024"
            maxLength={4}
            pattern="\d{4}"
            autoComplete="off"
          />
          {errors.ano && (
            <span className="text-sm text-red-600">{errors.ano.message}</span>
          )}
          <span className="text-xs text-gray-500">Ano letivo (4 dígitos)</span>
        </div>

        {/* Seletor de Curso */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Curso
            <span className="text-red-500 ml-1">*</span>
          </label>
          
          {/* Mensagem de erro com opção de recarregar */}
          {cursosError && (
            <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded text-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-red-800">Erro ao carregar cursos</div>
                  <div className="mt-1 text-red-700">{cursosError}</div>
                  <button
                    type="button"
                    onClick={handleReloadCursos}
                    disabled={cursosLoading}
                    className="mt-2 inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-500 border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {cursosLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Carregando...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Tentar novamente
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <select
            {...register('id_curso')}
            className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 transition-colors ${
              errors.id_curso 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
            }`}
            disabled={cursosLoading}
          >
            <option value="">
              {cursosLoading 
                ? '⏳ Carregando cursos...' 
                : cursosError 
                ? '❌ Erro ao carregar - clique em "Tentar novamente"'
                : cursosValidos.length === 0
                ? '📚 Nenhum curso encontrado'
                : `📚 Selecione um curso (${cursosValidos.length} disponíveis)`}
            </option>
            
            {/* Exibir cursos válidos */}
            {!cursosLoading && !cursosError && cursosValidos.map((curso, index) => (
              <option 
                key={`curso-${curso.id_curso}-${index}`}
                value={String(curso.id_curso)}
              >
                {curso.nome} - {curso.duracao} {curso.duracao === 1 ? 'mês' : 'meses'}
              </option>
            ))}
          </select>
          
          {errors.id_curso && (
            <span className="text-sm text-red-600">{errors.id_curso.message}</span>
          )}
          
          {/* Loading indicator dentro do select */}
          {cursosLoading && (
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Carregando cursos...
            </div>
          )}
          
          {/* Aviso se não há cursos */}
          {!cursosLoading && !cursosError && cursosValidos.length === 0 && cursos.length === 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-amber-800">
                    Nenhum curso cadastrado
                  </div>
                  <div className="text-sm text-amber-700">
                    Cadastre um curso primeiro na seção "Cursos" antes de criar uma turma.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Estatísticas dos cursos carregados */}
          {!cursosLoading && !cursosError && cursos.length > 0 && cursosValidos.length !== cursos.length && (
            <div className="mt-1 text-xs text-gray-500">
              {cursosValidos.length} de {cursos.length} cursos válidos carregados
              <span className="text-amber-600 ml-1">
                ({cursos.length - cursosValidos.length} cursos com dados inválidos)
              </span>
            </div>
          )}
        </div>

        {/* Seletor de Turno */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Turno
            <span className="text-red-500 ml-1">*</span>
          </label>
          
          <select
            {...register('turno')}
            className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 transition-colors ${
              errors.turno 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
            }`}
          >
            <option value="">Selecione o turno</option>
            <option value="DIURNO">🌅 Diurno</option>
            <option value="NOTURNO">🌙 Noturno</option>
          </select>
          
          {errors.turno && (
            <span className="text-sm text-red-600">{errors.turno.message}</span>
          )}
          <span className="text-xs text-gray-500">Turno de funcionamento da turma</span>
        </div>

      </div>
      
      {/* Preview da turma */}
      {(nomeValue || anoValue || cursoDetalhes || turnoSelecionado) && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Preview da Turma
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600 font-medium">Nome:</span> 
              <span className="text-gray-900 font-medium">
                {nomeValue || <span className="text-gray-400 italic">Não informado</span>}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600 font-medium">Ano:</span> 
              <span className="text-gray-900 font-medium">
                {anoValue || <span className="text-gray-400 italic">Não informado</span>}
              </span>
            </div>
            {cursoDetalhes && (
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600 font-medium">Curso:</span> 
                <span className="text-gray-900 font-medium">
                  {cursoDetalhes.nome}
                </span>
              </div>
            )}
            {cursoDetalhes && (
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600 font-medium">Duração:</span> 
                <span className="text-gray-900 font-medium">
                  {cursoDetalhes.duracao} {cursoDetalhes.duracao === 1 ? 'mês' : 'meses'}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600 font-medium">Turno:</span> 
              <span className="text-gray-900 font-medium">
                {turnoSelecionado === 'DIURNO' ? '🌅 Diurno' : 
                 turnoSelecionado === 'NOTURNO' ? '🌙 Noturno' : 
                 <span className="text-gray-400 italic">Não informado</span>}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botão para recarregar cursos manualmente */}
      {!cursosLoading && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleReloadCursos}
            className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recarregar Cursos
          </button>
        </div>
      )}
    </div>
  );
};

export default TurmaDataSection;