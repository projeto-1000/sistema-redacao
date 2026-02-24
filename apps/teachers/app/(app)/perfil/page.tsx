"use client";

import { Camera, Lock, User } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";

export default function EditProfilePage() {
  return (
    <div className="min-h-screen py-10 px-4 flex justify-center items-start">

      {/* Card Principal */}
      <div className="bg-white w-full max-w-3xl rounded-4xl p-8 md:p-12 shadow-sm border border-slate-200">

        {/* Cabeçalho */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black mb-3">Editar Informações</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Faça alterações no seu perfil de professor aqui. Clique em salvar quando terminar para atualizar seus dados no sistema.
          </p>
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="relative">
            <div className="size-28 rounded-full bg-slate-100 border-4 border-white shadow-sm flex items-center justify-center text-slate-300">
              <User className="size-12" />
            </div>

            <button
              type="button"
              className="absolute bottom-0 right-0 bg-slate-800 text-white p-2 rounded-full border-2 border-white hover:bg-slate-700 transition-colors shadow-sm"
              aria-label="Alterar foto de perfil"
            >
              <Camera className="size-4" />
            </button>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
            * Tamanho máximo: 5MB
          </span>
        </div>

        {/* Formulário */}
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>

          {/* Nome Completo */}
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">
              Nome Completo
            </label>
            <Input
              id="name"
              defaultValue="Professor Jane Doe"
              className="h-12 rounded-xl border-slate-200 focus-visible:ring-amber-400/50"
            />
          </div>

          {/* E-mail (Desabilitado) */}
          <div>
            <label htmlFor="email" className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              E-mail <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">(Não editável)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                id="email"
                disabled
                defaultValue="prof.janedoe@projeto1000.com"
                className="h-12 rounded-xl pl-11 bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="h-px w-full bg-slate-100 my-8"></div>

          {/* Seção de Segurança */}
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold mb-6">
              <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Lock className="size-4" />
              </div>
              Segurança
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nova Senha */}
              <div>
                <label htmlFor="new-password" className="block text-sm font-bold text-slate-700 mb-2">
                  Nova Senha
                </label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-amber-400/50"
                />
              </div>

              {/* Confirmar Senha */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-bold text-slate-700 mb-2">
                  Confirmar Senha
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-slate-200 focus-visible:ring-amber-400/50"
                />
              </div>
            </div>
          </div>

          {/* Ações (Botões) */}
          <div className="flex items-center justify-end gap-3 pt-8 mt-4">
            <Button
              type="button"
              variant="outline"
              className="h-12 px-6 rounded-xl border-slate-200 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-12 px-10 rounded-xl"
            >
              Salvar
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}