"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@repo/ui/components/button";
import { Send } from "lucide-react";

export function SubmitEssayButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className="h-12 w-full gap-2 rounded-full bg-[#10B981] font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:scale-105 hover:bg-[#059669] sm:w-auto"
      isLoading={pending}
      loadingText="Enviando..."
    >
      Enviar para Correção
      <Send className="size-4" />
    </Button>
  );
}
