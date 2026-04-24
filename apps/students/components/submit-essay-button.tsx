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
      className="w-full sm:w-auto bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-full h-12 shadow-lg shadow-green-500/20 gap-2 transition-all hover:scale-105"
      isLoading={pending}
      loadingText="Enviando..."
    >
      Enviar para Correção
      <Send className="size-4" />
    </Button>
  );
}