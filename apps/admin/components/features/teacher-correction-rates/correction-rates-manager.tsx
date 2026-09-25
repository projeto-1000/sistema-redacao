"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, CircleDollarSign, Info, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { Avatar } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";
import { formatDecimalCurrency } from "@repo/utils";
import { toast } from "sonner";
import {
  removeTeacherCorrectionRate,
  scheduleCorrectionRate,
  type CorrectionRateTeacherItem,
  type CorrectionRatesManagementData,
} from "@/app/actions/teacher-correction-rates";

function nextMonthValue() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${value.slice(0, 7)}-01T12:00:00Z`),
  );
}

export function CorrectionRatesManager({ data }: { data: CorrectionRatesManagementData }) {
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ kind: "default" } | { kind: "teacher"; teacher: CorrectionRateTeacherItem } | null>(null);
  const customTeachers = data.teachers.filter((teacher) => !teacher.usesDefault || teacher.scheduledRate !== null);
  const filteredTeachers = useMemo(
    () => customTeachers.filter((teacher) => `${teacher.name} ${teacher.email}`.toLowerCase().includes(query.toLowerCase())),
    [customTeachers, query],
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-bold text-slate-500">Valor padrão</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
              <p className="text-4xl font-black text-slate-900">{formatDecimalCurrency(data.defaultRate)}</p>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">Vigente</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-500">Aplicado a professores sem valor personalizado.</p>
              {data.defaultScheduledRate !== null && data.defaultScheduledFrom && (
                <p className="mt-2 text-sm font-bold text-blue-700">
                  {formatDecimalCurrency(data.defaultScheduledRate)} agendado para {formatMonth(data.defaultScheduledFrom)}
                </p>
              )}
            </div>
            <Button onClick={() => setModal({ kind: "default" })} className="rounded-xl font-bold">
              <Pencil className="size-4" /> Alterar valor padrão
            </Button>
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-900">
            <Info className="mt-0.5 size-5 shrink-0 text-blue-600" />
            <p>Alterações entram em vigor apenas no início da competência escolhida. Pagamentos de competências anteriores não serão recalculados.</p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard icon={<CircleDollarSign className="size-5" />} label="Valor padrão" value={formatDecimalCurrency(data.defaultRate)} />
          <SummaryCard icon={<Users className="size-5" />} label="Professores no padrão" value={String(data.teachers.filter((teacher) => teacher.usesDefault).length)} />
          <SummaryCard icon={<CalendarDays className="size-5" />} label="Com valor personalizado" value={String(data.teachers.filter((teacher) => !teacher.usesDefault).length)} />
        </div>

        <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Exceções por professor</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Professores com valor diferente do padrão ou alteração agendada.</p>
            </div>
            <Button onClick={() => setModal({ kind: "teacher", teacher: data.teachers.find((teacher) => teacher.usesDefault) ?? data.teachers[0]! })} disabled={data.teachers.length === 0} className="rounded-xl font-bold">
              <Plus className="size-4" /> Adicionar exceção
            </Button>
          </div>

          <div className="relative mb-5 max-w-md">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar professor" className="h-12 rounded-xl bg-slate-50 pl-11" />
          </div>

          <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 px-4 py-4 lg:grid">
            <span className="col-span-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Professor</span>
            <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</span>
            <span className="col-span-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Vigência
              <Tooltip><TooltipTrigger><Info className="size-3.5" /></TooltipTrigger><TooltipContent>Alterações sempre começam no primeiro dia de uma competência.</TooltipContent></Tooltip>
            </span>
            <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Origem</span>
            <span className="col-span-1 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredTeachers.length === 0 ? (
              <p className="py-12 text-center text-sm font-medium text-slate-500">Nenhuma exceção cadastrada.</p>
            ) : filteredTeachers.map((teacher) => (
              <div key={teacher.id} className="grid grid-cols-1 gap-4 px-4 py-5 lg:grid-cols-12 lg:items-center">
                <div className="flex items-center gap-3 lg:col-span-4">
                  <Avatar src={teacher.avatarUrl} name={teacher.name} className="size-10" />
                  <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{teacher.name}</p><p className="truncate text-xs font-medium text-slate-500">{teacher.email}</p></div>
                </div>
                <p className="text-sm font-black text-slate-900 lg:col-span-2">{formatDecimalCurrency(teacher.scheduledRate ?? teacher.currentRate)}</p>
                <p className="text-sm font-medium text-slate-500 lg:col-span-3">
                  {teacher.scheduledFrom ? `A partir de ${formatMonth(teacher.scheduledFrom)}` : `Desde ${formatMonth(teacher.effectiveFrom)}`}
                </p>
                <div className="lg:col-span-2"><span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${teacher.scheduledFrom ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{teacher.scheduledFrom ? "Agendado" : "Personalizado"}</span></div>
                <div className="flex justify-end lg:col-span-1"><Button variant="outline" size="icon" onClick={() => setModal({ kind: "teacher", teacher })} className="rounded-xl text-blue-600"><Pencil className="size-4" /></Button></div>
              </div>
            ))}
          </div>
        </section>

        {modal && <RateDialog data={data} target={modal} onClose={() => setModal(null)} />}
      </div>
    </TooltipProvider>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><span className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">{icon}</span><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="text-2xl font-black text-slate-900">{value}</p></div></div>;
}

function RateDialog({ data, target, onClose }: { data: CorrectionRatesManagementData; target: { kind: "default" } | { kind: "teacher"; teacher: CorrectionRateTeacherItem }; onClose: () => void }) {
  const [teacherId, setTeacherId] = useState(target.kind === "teacher" ? target.teacher.id : "");
  const initialRate = target.kind === "default" ? data.defaultScheduledRate ?? data.defaultRate : target.teacher.scheduledRate ?? target.teacher.currentRate;
  const [amount, setAmount] = useState(initialRate.toFixed(2).replace(".", ","));
  const [month, setMonth] = useState(nextMonthValue());
  const [isPending, startTransition] = useTransition();
  const teacher = data.teachers.find((item) => item.id === teacherId);
  const isDefault = target.kind === "default";
  const effectiveFrom = `${month}-01`;

  const submit = () => startTransition(async () => {
    const numericAmount = Number(amount.replace(",", "."));
    const result = await scheduleCorrectionRate({ teacherId: isDefault ? null : teacherId, amount: numericAmount, effectiveFrom });
    if (result.success) { toast.success("Novo valor agendado com sucesso."); onClose(); } else toast.error(result.error);
  });

  const remove = () => {
    if (!teacher) return;
    startTransition(async () => {
      const result = await removeTeacherCorrectionRate({ teacherId: teacher.id, effectiveFrom });
      if (result.success) { toast.success("Retorno ao valor padrão agendado."); onClose(); } else toast.error(result.error);
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl rounded-4xl border-none p-6 shadow-2xl">
        <DialogHeader><DialogTitle className="text-2xl font-black">{isDefault ? "Alterar valor padrão" : "Alterar valor por correção"}</DialogTitle></DialogHeader>
        <div className="space-y-5 py-2">
          {!isDefault && (
            <div><Label className="mb-2 text-xs font-black uppercase tracking-widest">Professor</Label><Select value={teacherId} onValueChange={setTeacherId}><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{data.teachers.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} • {item.email}</SelectItem>)}</SelectContent></Select></div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><Label htmlFor="correction-rate" className="mb-2 text-xs font-black uppercase tracking-widest">Valor por correção</Label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">R$</span><Input id="correction-rate" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="h-12 rounded-xl pl-12" /></div></div>
            <div><Label htmlFor="effective-month" className="mb-2 flex items-center gap-1 text-xs font-black uppercase tracking-widest">Válido a partir de <Info className="size-3.5 text-slate-400" /></Label><Input id="effective-month" type="month" min={nextMonthValue()} value={month} onChange={(event) => setMonth(event.target.value)} className="h-12 rounded-xl" /></div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-medium text-blue-900"><CalendarDays className="mt-0.5 size-5 shrink-0 text-blue-600" /><p>O novo valor começa a valer em 1º de {formatMonth(effectiveFrom)}. Redações e pagamentos de competências anteriores permanecerão com os valores atuais.</p></div>
          <div className="grid grid-cols-2 divide-x divide-slate-200 rounded-2xl bg-slate-50 p-5 text-center"><div><p className="text-xs font-medium text-slate-500">Valor atual</p><p className="mt-1 text-xl font-black">{formatDecimalCurrency(isDefault ? data.defaultRate : teacher?.currentRate ?? data.defaultRate)}</p></div><div><p className="text-xs font-medium text-slate-500">Novo valor</p><p className="mt-1 text-xl font-black text-blue-600">{formatDecimalCurrency(Number(amount.replace(",", ".")) || 0)}</p></div></div>
          {!isDefault && teacher && (!teacher.usesDefault || teacher.scheduledRate !== null) && <Button variant="ghost" onClick={remove} disabled={isPending} className="w-full justify-start rounded-xl text-red-600 hover:bg-red-50"><Trash2 className="size-4" /> Remover valor personalizado a partir desta competência</Button>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose} disabled={isPending} className="rounded-xl">Cancelar</Button><Button onClick={submit} disabled={isPending || !month || !teacherId && !isDefault} isLoading={isPending} loadingText="Agendando..." className="rounded-xl font-bold">Agendar alteração</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
