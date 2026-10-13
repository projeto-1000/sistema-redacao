"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const POST_REDIRECT_TOAST_KEY = "projeto1000:post-redirect-toast";

interface PostRedirectToastPayload {
  message: string;
  targetPathname: string;
}

export function queuePostRedirectSuccessToast(message: string, targetPath: string) {
  const targetPathname = targetPath.split("?")[0] || targetPath;

  window.sessionStorage.setItem(
    POST_REDIRECT_TOAST_KEY,
    JSON.stringify({ message, targetPathname } satisfies PostRedirectToastPayload)
  );
}

export function PostRedirectToast() {
  const pathname = usePathname();

  useEffect(() => {
    const storedPayload = window.sessionStorage.getItem(POST_REDIRECT_TOAST_KEY);

    if (!storedPayload) return;

    try {
      const payload = JSON.parse(storedPayload) as PostRedirectToastPayload;

      if (payload.targetPathname !== pathname) return;

      window.sessionStorage.removeItem(POST_REDIRECT_TOAST_KEY);
      toast.success(payload.message);
    } catch {
      window.sessionStorage.removeItem(POST_REDIRECT_TOAST_KEY);
    }
  }, [pathname]);

  return null;
}
