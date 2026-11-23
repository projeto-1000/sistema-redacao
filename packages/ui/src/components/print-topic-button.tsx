"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import type { EssayTopicDetail } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import { printEssayTopic } from "@repo/ui/lib/print-essay-topic";
import { cn } from "@repo/ui/lib/utils";

interface PrintTopicButtonProps {
  topic: EssayTopicDetail | null;
  disabled?: boolean;
  className?: string;
}

export function PrintTopicButton({ topic, disabled, className }: PrintTopicButtonProps) {
  const [printing, setPrinting] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      cleanupRef.current?.();
    };
  }, []);

  const handlePrint = async () => {
    if (!topic || printing) return;
    setPrinting(true);
    cleanupRef.current?.();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const cleanup = await printEssayTopic(topic, controller.signal);
      if (mountedRef.current) cleanupRef.current = cleanup;
      else cleanup();
    } catch (error) {
      if (mountedRef.current)
        toast.error(
          error instanceof Error ? error.message : "Não foi possível imprimir a proposta."
        );
    } finally {
      if (mountedRef.current) setPrinting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handlePrint}
      disabled={disabled || !topic || printing}
      aria-label={printing ? "Preparando impressão da proposta" : "Imprimir proposta"}
      aria-busy={printing}
      className={cn(
        "h-9 shrink-0 gap-2 rounded-xl border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-[#1E3A8A] hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900",
        className
      )}
    >
      {printing ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
      <span>Imprimir</span>
    </Button>
  );
}
