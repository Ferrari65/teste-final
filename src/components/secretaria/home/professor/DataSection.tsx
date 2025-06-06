'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormInput } from '@/components/ui/FormInput';
import type { ProfessorFormData } from '@/schemas'; // ✅ CORRIGIDO

interface PersonalDataSectionProps {
  form: UseFormReturn<ProfessorFormData>;
}

export const PersonalDataSection: React.FC<PersonalDataSectionProps> = ({ form }) => {
  const { register, formState: { errors } } = form;

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-700 mb-4">Dados Pessoais</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <FormInput
          label="Nome completo"
          {...register('nome')} // ✅ Zod já valida
          error={errors.nome?.message}
        />

        <FormInput
          label="CPF"
          placeholder="000.000.000-00"
          {...register('cpf')} // ✅ Zod já valida
          error={errors.cpf?.message}
        />

        <FormInput
          label="Telefone"
          type="tel"
          placeholder="(00) 00000-0000"
          {...register('telefone')} // ✅ Zod já valida
          error={errors.telefone?.message}
        />

        <FormInput
          label="Data de Nascimento"
          type="date"
          {...register('data_nasc')} // ✅ Zod já valida
          error={errors.data_nasc?.message}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Sexo</label>
          <select
            {...register('sexo')} // ✅ Zod já valida
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          >
            <option value="">Selecione</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
          {errors.sexo && <span className="text-sm text-red-500">{errors.sexo.message}</span>}
        </div>

        <FormInput
          label="E-mail"
          type="email"
          {...register('email')} // ✅ Zod já valida
          error={errors.email?.message}
        />

        <FormInput
          label="Senha"
          type="password"
          {...register('senha')} // ✅ Zod já valida
          error={errors.senha?.message}
        />

      </div>
    </div>
  );
};