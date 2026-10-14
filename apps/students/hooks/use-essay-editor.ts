"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { saveTemporaryBackup } from "@/app/actions/essay-drafts";

interface EssayBackup {
  content: string;
  updated_at: string;
  source_file_id: string | null;
}

export function useEssayEditor(
  themeId: string,
  serverBackup: EssayBackup | null,
  isDisabled = false,
  preferServerBackup = false
) {
  const backupKey = `@backup:${themeId}`;
  const sourceBackupKey = `@backup-source:${themeId}`;
  const subscribeToLocalBackup = useCallback(
    (onStoreChange: () => void) => {
      const handleStorage = (event: StorageEvent) => {
        if (event.key === backupKey || event.key === sourceBackupKey) onStoreChange();
      };

      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    },
    [backupKey, sourceBackupKey]
  );
  const getLocalBackup = useCallback(() => localStorage.getItem(backupKey), [backupKey]);
  const getLocalSourceBackup = useCallback(
    () => localStorage.getItem(sourceBackupKey),
    [sourceBackupKey]
  );
  const getServerSnapshot = useCallback(() => null, []);
  const localBackup = useSyncExternalStore(
    subscribeToLocalBackup,
    getLocalBackup,
    getServerSnapshot
  );
  const localSourceBackup = useSyncExternalStore(
    subscribeToLocalBackup,
    getLocalSourceBackup,
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
  const [editedSourceFile, setEditedSourceFile] = useState<{
    themeId: string;
    value: string | null;
  } | null>(null);
  const sourceFileId =
    editedSourceFile?.themeId === themeId
      ? editedSourceFile.value
      : preferServerBackup
        ? (serverBackup?.source_file_id ?? null)
        : (localSourceBackup ?? serverBackup?.source_file_id ?? null);
  const setContent = (value: string) => {
    setEditedContent({ themeId, value });
  };
  const setSourceFileId = (value: string | null) => {
    if (value) {
      localStorage.setItem(sourceBackupKey, value);
    } else {
      localStorage.removeItem(sourceBackupKey);
    }

    setEditedSourceFile({ themeId, value });
  };
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingBackupRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (isDisabled) return;
    if (
      content === "" ||
      (content === serverBackup?.content && sourceFileId === serverBackup?.source_file_id)
    ) {
      return;
    }

    localStorage.setItem(backupKey, content);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      timeoutRef.current = null;
      pendingBackupRef.current = pendingBackupRef.current
        .then(() => saveTemporaryBackup(themeId, content, sourceFileId))
        .catch((error) => {
          console.error("Erro no auto-save:", error);
        });
    }, 1500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [backupKey, content, themeId, serverBackup, sourceFileId, isDisabled]);

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
    localStorage.removeItem(sourceBackupKey);
  };

  return {
    content,
    setContent,
    sourceFileId,
    setSourceFileId,
    clearAutoSave,
    waitForAutoSave,
  };
}
