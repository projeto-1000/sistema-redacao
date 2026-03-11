"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import {
  Landmark,
  Plus,
  Wallet,
  Clock,
  Search,
  Filter,
  Pencil,
  Trash2,
  ArrowLeft
} from "lucide-react";

// Mocks do modal
const accountsData = [
  { id: 1, initials: "NB", bg: "bg-purple-100 text-purple-700", type: "PIX - Nubank", detail: "Chave: carlos.andrade@email.com", ag: "0001", cc: "1234567-8", owner: "Carlos Andrade" },
  { id: 2, initials: "BB", bg: "bg-yellow-100 text-yellow-700", type: "Banco do Brasil", detail: "Conta Corrente", ag: "1234-5", cc: "98765-4", owner: "Carlos Andrade" },
  { id: 3, initials: "IT", bg: "bg-orange-100 text-orange-700", type: "Itaú Unibanco", detail: "Poupança", ag: "2233", cc: "11223-4", owner: "Carlos Andrade" },
];

export function ManageAccountsModal() {
  const [view, setView] = useState<'list' | 'create'>('list');

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && setView('list')}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto h-11 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 font-bold px-6 transition-colors">
          <Landmark className="size-4 mr-2" /> Gerenciar contas de pagamento
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl p-0 overflow-hidden rounded-4xl border-none shadow-2xl bg-slate-50">

        {/* ===================================================
            VISÃO 1: LISTA DE CONTAS
        =================================================== */}
        {view === 'list' && (
          <div className="p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">

            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gerenciar Contas de Pagamento</h2>
              <Button onClick={() => setView('create')} className="rounded-full font-bold bg-blue-600 hover:bg-blue-700 text-white px-6 h-11 shadow-sm">
                <Plus className="size-4 mr-2" /> Adicionar Nova Conta
              </Button>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Landmark className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Contas Ativas</p>
                  <p className="text-lg font-black text-slate-900">3 Registradas</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Recebimento Padrão</p>
                  <p className="text-lg font-black text-emerald-600">PIX - Nubank</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="size-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Última Atualização</p>
                  <p className="text-lg font-black text-slate-900">Hoje, 10:45</p>
                </div>
              </div>
            </div>

            {/* Tabela de Contas Salvas */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Suas Contas Salvas</h3>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Filter className="size-4.5" /></button>
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Search className="size-4.5" /></button>
                </div>
              </div>

              <div className="w-full">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                  <div className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo / Banco</div>
                  <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Agência</div>
                  <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Conta</div>
                  <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Titular</div>
                  <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</div>
                </div>

                <div className="divide-y divide-slate-50">
                  {accountsData.map((acc) => (
                    <div key={acc.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 px-6 items-center hover:bg-slate-50 transition-colors">
                      <div className="col-span-4 flex items-center gap-4">
                        <div className={`size-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${acc.bg}`}>
                          {acc.initials}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{acc.type}</p>
                          <p className="text-[11px] font-medium text-slate-500">{acc.detail}</p>
                        </div>
                      </div>
                      <div className="col-span-2"><span className="text-sm font-bold text-slate-600">{acc.ag}</span></div>
                      <div className="col-span-2"><span className="text-sm font-bold text-slate-600">{acc.cc}</span></div>
                      <div className="col-span-3"><span className="text-sm font-bold text-slate-900">{acc.owner}</span></div>
                      <div className="col-span-1 flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg"><Trash2 className="size-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Mostrando 3 de 3 contas configuradas.</span>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Anterior</button>
                  <button className="size-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">1</button>
                  <button className="px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-900">Próximo</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            VISÃO 2: CADASTRAR NOVA CONTA
        =================================================== */}
        {view === 'create' && (
          <div className="p-6 md:p-8 space-y-8 animate-in slide-in-from-right-8 fade-in duration-300">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setView('list')} className="rounded-full hover:bg-slate-200">
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Adicionar Nova Conta</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">Preencha os dados bancários para recebimento de repasses.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Tipo de Conta</label>
                  <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none bg-white">
                    <option>PIX</option>
                    <option>Conta Corrente</option>
                    <option>Conta Poupança</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Banco</label>
                  <input type="text" placeholder="Ex: Nubank, Itaú..." className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Agência (Sem dígito)</label>
                  <input type="text" placeholder="0000" className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Conta (Com dígito)</label>
                  <input type="text" placeholder="000000-0" className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Chave PIX (Se aplicável)</label>
                  <input type="text" placeholder="E-mail, CPF, Telefone ou Aleatória" className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Nome do Titular</label>
                  <input type="text" placeholder="Nome completo" className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">CPF / CNPJ do Titular</label>
                  <input type="text" placeholder="000.000.000-00" className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/50 outline-none" />
                </div>

              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <input type="checkbox" id="defaultAcc" className="mt-1 size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                <label htmlFor="defaultAcc" className="text-sm font-bold text-slate-700 cursor-pointer">
                  Definir como conta padrão para recebimentos
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Os próximos repasses serão agendados automaticamente para esta conta.</p>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setView('list')} className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-200">
                Cancelar
              </Button>
              <Button onClick={() => setView('list')} className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-sm">
                Salvar Conta
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}