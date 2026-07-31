"use client";

import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";

import { Button } from "./button";
import { Logo } from "./logo";

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  items: NavItem[];
  activePath?: string;
  onLogout: () => Promise<void>;
}

export function Header({
  items,
  activePath = "",
  onLogout,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await onLogout();

    } catch (error) {
      setIsLoggingOut(false);
      console.error("[HEADER_LOGOUT_ERROR]", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-solid border-slate-200 bg-white/80 px-6 shadow-sm backdrop-blur-md">
      <a href="/">
        <Logo className="h-12" />
      </a>

      <div className="hidden items-center justify-end gap-6 md:flex!">
        <nav className="flex items-center gap-4 text-sm font-medium">
          {items.map((item) => {
            const isActive = activePath === item.href;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  border-b-2 py-1 transition-colors duration-300
                  ${isActive
                    ? "border-primary font-bold"
                    : "border-transparent text-gray-600 hover:text-primary"
                  }
                `}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <Button
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          isLoading={isLoggingOut}
          loadingText="Saindo..."
          className="gap-2 bg-transparent font-bold text-red-500 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>

      <div className="flex md:hidden!">
        <button
          type="button"
          disabled={isLoggingOut}
          onClick={() =>
            setIsMobileMenuOpen(
              !isMobileMenuOpen
            )
          }
          className="p-2 text-gray-600 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-50"
        >
          {isMobileMenuOpen ? (
            <X className="size-6" />
          ) : (
            <Menu className="size-6" />
          )}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute left-0 top-16 flex w-full animate-in flex-col border-b border-slate-200 bg-white p-4 shadow-xl duration-200 slide-in-from-top-2 md:hidden">
          <nav className="flex flex-col gap-2">
            {items.map((item) => {
              const isActive =
                activePath === item.href;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setIsMobileMenuOpen(false)
                  }
                  className={`
                    rounded-md px-4 py-3 text-sm font-medium transition-colors
                    ${isActive
                      ? "border-primary font-bold"
                      : "border-transparent text-gray-600 hover:text-primary"
                    }
                  `}
                >
                  {item.label}
                </a>
              );
            })}

            <div className="my-2 h-px bg-slate-100" />

            <Button
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              isLoading={isLoggingOut}
              loadingText="Saindo..."
              className="w-full justify-start gap-2 bg-transparent px-4 py-3 font-bold text-red-500 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}