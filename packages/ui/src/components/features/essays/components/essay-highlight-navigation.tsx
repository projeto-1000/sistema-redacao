"use client";

import { createContext, useContext, useState } from "react";

interface EssayHighlightNavigationContextValue {
  activeHighlightId: string | null;
  isEnabled: boolean;
  setActiveHighlightId: (id: string | null) => void;
}

const EssayHighlightNavigationContext =
  createContext<EssayHighlightNavigationContextValue>({
    activeHighlightId: null,
    isEnabled: false,
    setActiveHighlightId: () => undefined,
  });

export function EssayHighlightNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  return (
    <EssayHighlightNavigationContext.Provider
      value={{ activeHighlightId, isEnabled: true, setActiveHighlightId }}
    >
      {children}
    </EssayHighlightNavigationContext.Provider>
  );
}

export function useEssayHighlightNavigation() {
  return useContext(EssayHighlightNavigationContext);
}

export function scrollToEssayFeedbackElement(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.scrollIntoView({ behavior: "smooth", block: "center" });

  window.setTimeout(() => {
    element.focus({ preventScroll: true });
  }, 300);
}
