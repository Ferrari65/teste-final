// src/components/secretaria/home/turma/TurmaDataSection.tsx - VERSÃO SIMPLES

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
  
  // ✅ USAR O MESMO HOOK QUE FUNCIONA NA LISTAGEM
  const { cursos, loading: cursosLoading, error: cursosError } = useCursoList();
  
  // Observa os valores selecionados
  const cursoSelecionado = watch('id_curso');
  const turnoSelecionado = watch('turno');
  
  // ✅ MESMO FILTRO DA LISTAGEM
  const cursosValidos = cursos.filter(curso => 
    curso && 
    curso.id_curso && 
    curso.nome && 
    curso.nome.trim() !== ''
  );

  // Buscar curso selecionado
  const cursoDetalhes = cursos.find(curso => 
    String(curso.id_curso) === String(cursoSelecionado)
  );

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

        {/* Seletor de Curso - IGUAL A LISTAGEM */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Curso
            <span className="text-red-500 ml-1">*</span>
          </label>
          
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
                ? 'Carregando cursos...' 
                : cursosError 
                ? 'Erro ao carregar cursos'
                : cursosValidos.length === 0
                ? 'Nenhum curso disponível'
                : `Selecione um curso (${cursosValidos.length} disponíveis)`}
            </option>
            
            {/* ✅ MESMO MAPEAMENTO DA LISTAGEM */}
            {cursosValidos.map((curso) => (
              <option 
                key={curso.id_curso}
                value={String(curso.id_curso)}
              >
                {curso.nome} - {curso.duracao} {curso.duracao === 1 ? 'mês' : 'meses'}
              </option>
            ))}
          </select>
          
          {errors.id_curso && (
            <span className="text-sm text-red-600">{errors.id_curso.message}</span>
          )}
          
          {/* Mensagem de erro simplificada */}
          {cursosError && (
            <div className="mt-1 text-sm text-red-600">
              {cursosError}
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
                <span className="ml-1 font-medium">
                  {cursoDetalhes.nome} ({cursoDetalhes.duracao} meses)
                </span>
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

export default TurmaDataSection;