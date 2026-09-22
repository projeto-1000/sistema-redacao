"use client";

import { useState, useTransition } from "react";
import type { TeacherPaymentAccount, TeacherPaymentAccountType, TeacherPaymentPixType } from "@repo/types";
import { accountFormSchema, type AccountFormValues } from "@repo/validators";
import { formatDocument, maskPixKey } from "@repo/utils";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";

interface PaymentAccountFormProps {
  initialData?: TeacherPaymentAccount | null;
  onCancel: () => void;
  onSubmit: (values: AccountFormValues) => Promise<{ success: boolean; error?: string }>;
}

export function PaymentAccountForm({ initialData, onCancel, onSubmit }: PaymentAccountFormProps) {
  const [type, setType] = useState<TeacherPaymentAccountType>(initialData?.type ?? "pix");
  const [pixType, setPixType] = useState<TeacherPaymentPixType>(initialData?.pix_type ?? "cpf");
  const [pixKey, setPixKey] = useState(initialData?.pix_key ? maskPixKey(initialData.pix_key, initialData.pix_type ?? "cpf") : "");
  const [bankName, setBankName] = useState(initialData?.bank_name ?? "");
  const [accountVariant, setAccountVariant] = useState<"corrente" | "poupanca">(initialData?.account_variant ?? "corrente");
  const [agency, setAgency] = useState(initialData?.agency ?? "");
  const [accountNumber, setAccountNumber] = useState(initialData?.account_number ?? "");
  const [ownerName, setOwnerName] = useState(initialData?.owner_name ?? "");
  const [ownerDocument, setOwnerDocument] = useState(initialData?.owner_document ? formatDocument(initialData.owner_document) : "");
  const [isDefault, setIsDefault] = useState(initialData?.is_default ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const candidate = type === "pix"
      ? { type, pixType, pixKey, ownerName, ownerDocument, isDefault }
      : { type, bankName, accountVariant, agency, accountNumber, ownerName, ownerDocument, isDefault };
    const parsed = accountFormSchema.safeParse(candidate);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os dados informados.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await onSubmit(parsed.data);
      if (!result.success) setError(result.error ?? "Não foi possível salvar a conta.");
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setType("pix")} className={`h-11 rounded-xl border-2 text-sm font-bold ${type === "pix" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}>Chave PIX</button>
        <button type="button" onClick={() => setType("bank_account")} className={`h-11 rounded-xl border-2 text-sm font-bold ${type === "bank_account" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}>Conta bancária</button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {type === "pix" ? (
          <>
            <Field label="Tipo de chave"><Select value={pixType} onValueChange={(value) => { setPixType(value as TeacherPaymentPixType); setPixKey(""); }}><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cpf">CPF</SelectItem><SelectItem value="cnpj">CNPJ</SelectItem><SelectItem value="phone">Telefone</SelectItem><SelectItem value="email">E-mail</SelectItem><SelectItem value="random">Chave aleatória</SelectItem></SelectContent></Select></Field>
            <Field label="Chave PIX"><Input value={pixKey} onChange={(event) => setPixKey(maskPixKey(event.target.value, pixType))} className="h-12 rounded-xl" /></Field>
          </>
        ) : (
          <>
            <Field label="Banco"><Input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Ex.: Nubank" className="h-12 rounded-xl" /></Field>
            <Field label="Tipo de conta"><Select value={accountVariant} onValueChange={(value) => setAccountVariant(value as "corrente" | "poupanca")}><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="corrente">Conta corrente</SelectItem><SelectItem value="poupanca">Conta poupança</SelectItem></SelectContent></Select></Field>
            <Field label="Agência"><Input value={agency} onChange={(event) => setAgency(event.target.value)} className="h-12 rounded-xl" /></Field>
            <Field label="Conta com dígito"><Input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} className="h-12 rounded-xl" /></Field>
          </>
        )}

        <div className="sm:col-span-2 h-px bg-slate-100" />
        <Field label="Nome do titular"><Input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} className="h-12 rounded-xl" /></Field>
        <Field label="CPF/CNPJ do titular"><Input value={ownerDocument} onChange={(event) => setOwnerDocument(formatDocument(event.target.value))} className="h-12 rounded-xl" /></Field>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <Checkbox checked={isDefault} onCheckedChange={(value) => setIsDefault(value === true)} className="mt-0.5" />
        <span><span className="block text-sm font-bold text-slate-800">Definir como conta principal</span><span className="block text-xs font-medium text-slate-500">Os próximos repasses usarão esta conta.</span></span>
      </label>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending} className="rounded-xl">Cancelar</Button>
        <Button type="submit" isLoading={isPending} loadingText="Salvando..." className="rounded-xl font-bold">Salvar conta</Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</Label>{children}</div>;
}
