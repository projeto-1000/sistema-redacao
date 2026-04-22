"use client";

import { useState, useEffect, useRef } from "react";
import { saveTemporaryBackup } from "@/app/actions/essay-drafts";

interface EssayBackup {
  content: string;
  updated_at: string;
}

export function useEssayEditor(themeId: string, serverBackup: EssayBackup | null) {
  const [content, setContent] = useState<string>(serverBackup?.content || "");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Sincronização inicial (Hydration)
  useEffect(() => {
    const localContent = localStorage.getItem(`@backup:${themeId}`);

    if (localContent) {
      setContent(localContent);
    } else if (serverBackup?.content) {
      setContent(serverBackup.content);
    }
  }, [themeId, serverBackup]);

  // 2. Auto-save para localStorage e Banco
  useEffect(() => {
    if (content === "" || content === serverBackup?.content) return;

    localStorage.setItem(`@backup:${themeId}`, content);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        await saveTemporaryBackup(themeId, content);
      } catch (e) {
        console.error("Erro no auto-save:", e);
      }
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [content, themeId, serverBackup]);

  // 3. NOVA FUNÇÃO: Faxina completa
  const clearAutoSave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    localStorage.removeItem(`@backup:${themeId}`);
  };

  // 4. Retorne a função de limpeza
  return { content, setContent, clearAutoSave };
}
