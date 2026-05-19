"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@repo/ui/components/dialog";
import { ReactNode, useState, useTransition, useCallback } from "react";

interface ModalWrapperProps {
  children: ReactNode;
  param: string;
  title?: string;
  className?: string;
}

export function ModalWrapper({
  children,
  param,
  title = "Visualização de Detalhes",
  className = "min-w-[80%] max-h-[95%] p-8 bg-slate-50 overflow-y-auto focus:outline-none"
}: ModalWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(true);
  const [, startTransition] = useTransition();

  const deleteQueryString = useCallback(
    (name: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(name);
      return params.toString();
    },
    [searchParams]
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsOpen(false);
      startTransition(() => {
        const newQuery = deleteQueryString(param);
        const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
        router.replace(newUrl, { scroll: false });
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={className}
        onPointerDownOutside={(e) => e.stopPropagation()}
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}