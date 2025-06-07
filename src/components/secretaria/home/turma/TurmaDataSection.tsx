// src/components/secretaria/home/turma/TurmaDataSection.tsx

'use client';

import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useCursoList } from '@/hooks/secretaria/curso';
import type { TurmaFormData } from '@/schemas';

interface TurmaDataSectionProps {
  form: UseFormReturn<TurmaFormData>;
}

// ✅ EXPORT NOMEADO CORRETO
export const TurmaDataSection: React.FC<TurmaDataSectionProps> = ({ form }) => {
  const { register, formState: { errors }, watch } = form;
  
  // Carrega cursos do banco automaticamente
  const { cursos, loading: cursosLoading, error: cursosError } = useCursoList();
  
  // Debug para verificar estrutura dos dados
  useEffect(() => {
    console.log('🔍 DEBUG TurmaDataSection:');
    console.log('📊 Cursos carregados:', cursos);
    console.log('📏 Quantidade:', cursos?.length || 0);
    
    if (cursos && cursos.length > 0) {
      console.log('📚 Primeiro curso:', cursos[0]);
      console.log('🔑 Chaves:', Object.keys(cursos[0]));
    }
  }, [cursos]);
  
  // Observa o curso selecionado para mostrar detalhes
  const cursoSelecionado = watch('id_curso');
  const turnoSelecionado = watch('turno');
  
  // Filtro de cursos válidos - baseado no SQL real
  const cursosValidos = cursos.filter((curso, index) => {
    if (!curso) {
      console.log(`❌ Curso ${index}: null/undefined`);
      return false;
    }
    
    // Verificar se id_curso existe e é um número válido
    const hasValidId = curso.id_curso !== undefined && 
                      curso.id_curso !== null && 
                      (typeof curso.id_curso === 'number' || 
                       (typeof curso.id_curso === 'string' && !isNaN(parseInt(curso.id_curso, 10))));
    
    console.log(`🔍 Curso ${index}:`, {
      nome: curso.nome,
      id_curso: curso.id_curso,
      type: typeof curso.id_curso,
      hasValidId
    });
    
    return hasValidId && curso.nome;
  });

  // Buscar curso selecionado (comparar como string, pois vem do form)
  const cursoDetalhes = cursos.find(curso => 
    String(curso.id_curso) === String(cursoSelecionado)
  );

  console.log('✅ Resultado final:');
  console.log('📊 Cursos válidos:', cursosValidos.length);

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
          
          {cursosError && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              Erro ao carregar cursos: {cursosError}
            </div>
          )}
          
          <select
            {...register('id_curso')}
            className={`mt-1 block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 transition-colors ${
              errors.id_curso 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
            }`}
            disabled={cursosLoading || cursosError !== null}
          >
            <option value="">
              {cursosLoading 
                ? '⏳ Carregando cursos...' 
                : cursosError 
                ? '❌ Erro ao carregar cursos'
                : `📚 Selecione um curso (${cursosValidos.length} disponíveis)`}
            </option>
            
            {/* Usar cursos válidos com ID INTEGER */}
            {!cursosLoading && !cursosError && cursosValidos.map((curso, index) => (
              <option 
                key={`curso-${curso.id_curso}-${index}`}
                value={String(curso.id_curso)} // Converter para string para o form
              >
                {curso.nome} - {curso.duracao} {curso.duracao === 1 ? 'mês' : 'meses'}
              </option>
            ))}
          </select>
          
          {errors.id_curso && (
            <span className="text-sm text-red-600">{errors.id_curso.message}</span>
          )}
          
          {/* Avisos se não há cursos */}
          {!cursosLoading && !cursosError && cursosValidos.length === 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-amber-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
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
            <option value="DIURNO">🌅 Diurno (Manhã/Tarde)</option>
            <option value="NOTURNO">🌙 Noturno</option>
          </select>
          
          {errors.turno && (
            <span className="text-sm text-red-600">{errors.turno.message}</span>
          )}
          <span className="text-xs text-gray-500">Turno de funcionamento da turma</span>
        </div>

      </div>
      
      {/* Preview da turma */}
      {(cursoDetalhes || turnoSelecionado) && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">📋 Preview da Turma</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Nome:</span> 
              <span className="ml-1 font-medium">{watch('nome') || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-gray-600">Ano:</span> 
              <span className="ml-1 font-medium">{watch('ano') || 'Não informado'}</span>
            </div>
            {cursoDetalhes && (
              <div>
                <span className="text-gray-600">Curso:</span> 
                <span className="ml-1 font-medium">{cursoDetalhes.nome}</span>
              </div>
            )}
            <div>
              <span className="text-gray-600">Turno:</span> 
              <span className="ml-1 font-medium">
                {turnoSelecionado === 'DIURNO' ? '🌅 Diurno' : 
                 turnoSelecionado === 'NOTURNO' ? '🌙 Noturno' : 
                 'Não informado'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ EXPORT DEFAULT TAMBÉM PARA COMPATIBILIDADE
export default TurmaDataSection;