"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { TeacherPaymentAccount } from "@repo/types";
import { Button } from "@repo/ui/components/button";

export function CopyPaymentAccountButton({
  account,
}: {
  account: TeacherPaymentAccount;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPix = account.type === "pix";

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const scheduleStatusReset = () => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      setStatus("idle");
      resetTimeoutRef.current = null;
    }, 2200);
  };

  const copy = async () => {
    const content = isPix
      ? (account.pix_key ?? "")
      : [
        `Banco: ${account.bank_name ?? ""}`,
        `Agência: ${account.agency ?? ""}`,
        `Conta ${account.account_variant ?? ""}: ${account.account_number ?? ""}`,
        `Titular: ${account.owner_name}`,
        `CPF/CNPJ: ${account.owner_document}`,
      ].join("\n");

    try {
      await navigator.clipboard.writeText(content);
      setStatus("copied");
      scheduleStatusReset();
    } catch {
      setStatus("error");
      scheduleStatusReset();
    }
  };

  const label =
    status === "copied"
      ? isPix
        ? "Chave PIX copiada"
        : "Dados copiados"
      : status === "error"
        ? "Não foi possível copiar"
        : isPix
          ? "Copiar chave PIX"
          : "Copiar dados da conta";

  return (
    <Button
      type="button"
      variant="outline"
      onClick={copy}
      className="h-10 shrink-0 rounded-xl px-3 font-bold text-primary"
    >
      {status === "copied" ? (
        <Check className="size-4" />
      ) : (
        <Copy className="size-4" />
      )}
      <span aria-live="polite">{label}</span>
    </Button>
  );
}
