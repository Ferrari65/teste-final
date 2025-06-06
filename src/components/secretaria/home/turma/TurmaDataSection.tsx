'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormInput } from '@/components/ui/FormInput';
import { useCursoList } from '@/hooks/secretaria/curso';
import type { TurmaFormData } from '@/schemas';

interface TurmaDataSectionProps {
  form: UseFormReturn<TurmaFormData>;
}

export const TurmaDataSection: React.FC<TurmaDataSectionProps> = ({ form }) => {
  const { register, formState: { errors } } = form;

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
            Ano
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

        {/* Turno */}
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
            <option value="DIURNO">Diurno</option>
            <option value="NOTURNO">Noturno</option>
          </select>
          {errors.turno && (
            <span className="text-sm text-red-600">{errors.turno.message}</span>
          )}
        </div>

      </div>
    </div>
  );
};