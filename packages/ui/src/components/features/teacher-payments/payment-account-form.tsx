"use client";

import { useState, useTransition } from "react";
import type {
  TeacherPaymentAccount,
  TeacherPaymentAccountType,
  TeacherPaymentPixType,
} from "@repo/types";
import { accountFormSchema, type AccountFormValues } from "@repo/validators";
import { formatDocument, maskPixKey } from "@repo/utils";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { BankNameInput } from "./bank-name-input";

interface PaymentAccountFormProps {
  initialData?: TeacherPaymentAccount | null;
  onCancel: () => void;
  onSubmit: (
    values: AccountFormValues,
  ) => Promise<{ success: boolean; error?: string }>;
}

type FieldName =
  | "pixKey"
  | "bankName"
  | "agency"
  | "accountNumber"
  | "ownerName"
  | "ownerDocument";

type FieldErrors = Partial<Record<FieldName, string>>;

const pixPlaceholders: Record<TeacherPaymentPixType, string> = {
  cpf: "000.000.000-00",
  cnpj: "00.000.000/0000-00",
  phone: "(00) 00000-0000",
  email: "nome@exemplo.com",
  random: "00000000-0000-0000-0000-000000000000",
};

const pixMaxLength: Record<TeacherPaymentPixType, number> = {
  cpf: 14,
  cnpj: 18,
  phone: 15,
  email: 254,
  random: 36,
};

export function PaymentAccountForm({
  initialData,
  onCancel,
  onSubmit,
}: PaymentAccountFormProps) {
  const [type, setType] = useState<TeacherPaymentAccountType>(
    initialData?.type ?? "pix",
  );
  const [pixType, setPixType] = useState<TeacherPaymentPixType>(
    initialData?.pix_type ?? "cpf",
  );
  const [pixKey, setPixKey] = useState(
    initialData?.pix_key
      ? maskPixKey(initialData.pix_key, initialData.pix_type ?? "cpf")
      : "",
  );
  const [bankName, setBankName] = useState(initialData?.bank_name ?? "");
  const [accountVariant, setAccountVariant] = useState<"corrente" | "poupanca">(
    initialData?.account_variant ?? "corrente",
  );
  const [agency, setAgency] = useState(initialData?.agency ?? "");
  const [accountNumber, setAccountNumber] = useState(
    initialData?.account_number ?? "",
  );
  const [ownerName, setOwnerName] = useState(initialData?.owner_name ?? "");
  const [ownerDocument, setOwnerDocument] = useState(
    initialData?.owner_document
      ? formatDocument(initialData.owner_document)
      : "",
  );
  const [isDefault, setIsDefault] = useState(initialData?.is_default ?? false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const clearFieldError = (field: FieldName) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const changeType = (nextType: TeacherPaymentAccountType) => {
    setType(nextType);
    setFieldErrors({});
    setError(null);
  };

  const getCandidate = () =>
    type === "pix"
      ? { type, pixType, pixKey, ownerName, ownerDocument, isDefault }
      : {
        type,
        bankName,
        accountVariant,
        agency,
        accountNumber,
        ownerName,
        ownerDocument,
        isDefault,
      };

  const validateField = (field: FieldName) => {
    const parsed = accountFormSchema.safeParse(getCandidate());
    const issue = parsed.success
      ? undefined
      : parsed.error.issues.find(
        (currentIssue) => currentIssue.path[0] === field,
      );

    setFieldErrors((current) => ({ ...current, [field]: issue?.message }));
  };

  const isFormValid = accountFormSchema.safeParse(getCandidate()).success;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = accountFormSchema.safeParse(getCandidate());

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as FieldName | undefined;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setFieldErrors(nextErrors);
      setError(null);
      return;
    }

    setFieldErrors({});
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(parsed.data);
      if (!result.success)
        setError(result.error ?? "Não foi possível salvar a conta.");
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => changeType("pix")}
          className={`h-11 rounded-xl border-2 text-sm font-bold ${type === "pix" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}
        >
          Chave PIX
        </button>
        <button
          type="button"
          onClick={() => changeType("bank_account")}
          className={`h-11 rounded-xl border-2 text-sm font-bold ${type === "bank_account" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}
        >
          Conta bancária
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {type === "pix" ? (
          <>
            <Field label="Tipo de chave">
              <Select
                value={pixType}
                onValueChange={(value) => {
                  setPixType(value as TeacherPaymentPixType);
                  setPixKey("");
                  clearFieldError("pixKey");
                }}
              >
                <SelectTrigger className="min-h-12 w-full rounded-xl">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="random">Chave aleatória</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Chave PIX" error={fieldErrors.pixKey}>
              <Input
                value={pixKey}
                onChange={(event) => {
                  setPixKey(maskPixKey(event.target.value, pixType));
                  clearFieldError("pixKey");
                }}
                placeholder={pixPlaceholders[pixType]}
                maxLength={pixMaxLength[pixType]}
                onBlur={() => validateField("pixKey")}
                aria-invalid={Boolean(fieldErrors.pixKey)}
                className="h-12 rounded-xl"
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Banco" error={fieldErrors.bankName}>
              <BankNameInput
                value={bankName}
                onChange={(value) => {
                  setBankName(value);
                  clearFieldError("bankName");
                }}
              />
            </Field>
            <Field label="Tipo de conta">
              <Select
                value={accountVariant}
                onValueChange={(value) =>
                  setAccountVariant(value as "corrente" | "poupanca")
                }
              >
                <SelectTrigger className="min-h-12 w-full rounded-xl">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta corrente</SelectItem>
                  <SelectItem value="poupanca">Conta poupança</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Agência (sem dígito)" error={fieldErrors.agency}>
              <Input
                value={agency}
                onChange={(event) => {
                  setAgency(event.target.value.replace(/\D/g, "").slice(0, 4));
                  clearFieldError("agency");
                }}
                placeholder="Ex.: 1234"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                onBlur={() => validateField("agency")}
                aria-invalid={Boolean(fieldErrors.agency)}
                className="h-12 rounded-xl"
              />
            </Field>
            <Field
              label="Conta (incluindo dígito)"
              error={fieldErrors.accountNumber}
            >
              <Input
                value={accountNumber}
                onChange={(event) => {
                  setAccountNumber(
                    event.target.value.replace(/\D/g, "").slice(0, 20),
                  );
                  clearFieldError("accountNumber");
                }}
                placeholder="Ex.: 123456789"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={20}
                onBlur={() => validateField("accountNumber")}
                aria-invalid={Boolean(fieldErrors.accountNumber)}
                className="h-12 rounded-xl"
              />
            </Field>
          </>
        )}

        <div className="h-px bg-slate-100 sm:col-span-2" />
        <Field label="Nome do titular" error={fieldErrors.ownerName}>
          <Input
            value={ownerName}
            onChange={(event) => {
              setOwnerName(event.target.value);
              clearFieldError("ownerName");
            }}
            placeholder="Nome como consta na conta"
            maxLength={120}
            onBlur={() => validateField("ownerName")}
            aria-invalid={Boolean(fieldErrors.ownerName)}
            className="h-12 rounded-xl"
          />
        </Field>
        <Field label="CPF/CNPJ do titular" error={fieldErrors.ownerDocument}>
          <Input
            value={ownerDocument}
            onChange={(event) => {
              setOwnerDocument(formatDocument(event.target.value));
              clearFieldError("ownerDocument");
            }}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={18}
            onBlur={() => validateField("ownerDocument")}
            aria-invalid={Boolean(fieldErrors.ownerDocument)}
            className="h-12 rounded-xl"
          />
        </Field>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <Checkbox
          checked={isDefault}
          onCheckedChange={(value) => setIsDefault(value === true)}
          className="mt-0.5"
        />
        <span>
          <span className="block text-sm font-bold text-slate-800">
            Definir como conta principal
          </span>
          <span className="block text-xs font-medium text-slate-500">
            Os próximos pagamentos usarão esta conta.
          </span>
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-xl"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending || !isFormValid}
          isLoading={isPending}
          loadingText="Salvando..."
          className="rounded-xl font-bold"
        >
          Salvar conta
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600">
        {label}
      </Label>
      {children}
      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
