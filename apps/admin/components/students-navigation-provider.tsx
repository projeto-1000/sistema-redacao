"use client";

import { useRouter } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useMemo, useTransition } from "react";

interface NavigateOptions {
  replace?: boolean;
  scroll?: boolean;
}

interface StudentsNavigationContextValue {
  isPending: boolean;
  navigate: (href: string, options?: NavigateOptions) => void;
}

const StudentsNavigationContext = createContext<StudentsNavigationContextValue | null>(null);

export function StudentsNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(
    (href: string, options: NavigateOptions = {}) => {
      startTransition(() => {
        if (options.replace) {
          router.replace(href, { scroll: options.scroll });
          return;
        }

        router.push(href, { scroll: options.scroll });
      });
    },
    [router]
  );

  const value = useMemo(() => ({ isPending, navigate }), [isPending, navigate]);

  return (
    <StudentsNavigationContext.Provider value={value}>
      {children}
    </StudentsNavigationContext.Provider>
  );
}

export function useStudentsNavigation() {
  const context = useContext(StudentsNavigationContext);

  if (!context) {
    throw new Error("useStudentsNavigation deve ser usado dentro de StudentsNavigationProvider.");
  }

  return context;
}
