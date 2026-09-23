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
  isDisabled = false,
  preferServerBackup = false
) {
  const [content, setContent] = useState<string>(serverBackup?.content || "");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingBackupRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (preferServerBackup) {
      setContent(serverBackup?.content || "");
      return;
    }

    const localContent = localStorage.getItem(`@backup:${themeId}`);

    if (localContent) {
      setContent(localContent);
    } else if (serverBackup?.content) {
      setContent(serverBackup.content);
    }
  }, [themeId, serverBackup, preferServerBackup]);

  useEffect(() => {
    if (isDisabled) return;
    if (content === "" || content === serverBackup?.content) return;

    localStorage.setItem(`@backup:${themeId}`, content);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      timeoutRef.current = null;
      pendingBackupRef.current = pendingBackupRef.current
        .then(() => saveTemporaryBackup(themeId, content))
        .catch((error) => {
          console.error("Erro no auto-save:", error);
        });
    }, 1500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [content, themeId, serverBackup, isDisabled]);

  const waitForAutoSave = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    await pendingBackupRef.current;
  };

  const clearAutoSave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    localStorage.removeItem(`@backup:${themeId}`);
  };

  return { content, setContent, clearAutoSave, waitForAutoSave };
}
