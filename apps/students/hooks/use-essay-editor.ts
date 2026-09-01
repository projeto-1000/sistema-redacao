"use client";

import { useState, useEffect, useRef } from "react";
import { saveTemporaryBackup } from "@/app/actions/essay-drafts";

interface EssayBackup {
  content: string;
  updated_at: string;
}

export function useEssayEditor(
  themeId: string,
  serverBackup: EssayBackup | null,
  isDisabled = false
) {
  const [content, setContent] = useState<string>(serverBackup?.content || "");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const localContent = localStorage.getItem(`@backup:${themeId}`);

    if (localContent) {
      setContent(localContent);
    } else if (serverBackup?.content) {
      setContent(serverBackup.content);
    }
  }, [themeId, serverBackup]);

  useEffect(() => {
    if (isDisabled) return;
    if (content === "" || content === serverBackup?.content) return;

    localStorage.setItem(`@backup:${themeId}`, content);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        await saveTemporaryBackup(themeId, content);
      } catch (e) {
        console.error("Erro no auto-save:", e);
      }
    }, 1500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [content, themeId, serverBackup, isDisabled]);

  const clearAutoSave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    localStorage.removeItem(`@backup:${themeId}`);
  };

  return { content, setContent, clearAutoSave };
}
