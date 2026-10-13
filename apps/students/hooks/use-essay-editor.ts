"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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
  const backupKey = `@backup:${themeId}`;
  const subscribeToLocalBackup = useCallback(
    (onStoreChange: () => void) => {
      const handleStorage = (event: StorageEvent) => {
        if (event.key === backupKey) onStoreChange();
      };

      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    },
    [backupKey]
  );
  const getLocalBackup = useCallback(() => localStorage.getItem(backupKey), [backupKey]);
  const getServerSnapshot = useCallback(() => null, []);
  const localBackup = useSyncExternalStore(
    subscribeToLocalBackup,
    getLocalBackup,
    getServerSnapshot
  );
  const [editedContent, setEditedContent] = useState<{
    themeId: string;
    value: string;
  } | null>(null);
  const initialContent = preferServerBackup
    ? serverBackup?.content || ""
    : localBackup || serverBackup?.content || "";
  const content = editedContent?.themeId === themeId ? editedContent.value : initialContent;
  const setContent = (value: string) => {
    setEditedContent({ themeId, value });
  };
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingBackupRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (isDisabled) return;
    if (content === "" || content === serverBackup?.content) return;

    localStorage.setItem(backupKey, content);

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
  }, [backupKey, content, themeId, serverBackup, isDisabled]);

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

    localStorage.removeItem(backupKey);
  };

  return { content, setContent, clearAutoSave, waitForAutoSave };
}
