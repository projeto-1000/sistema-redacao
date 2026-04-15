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
  onLogout: () => void;
  variant?: 'default' | 'admin'
}

export function Header({
  items,
  activePath = '',
  onLogout,
  variant = 'default'
}: HeaderProps) {

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-solid border-slate-200 bg-white/80 backdrop-blur-md px-6 h-16 flex items-center justify-between shadow-sm">

      <a href="/">
        <Logo className="h-12" />
      </a>

      <div className="hidden md:flex! items-center justify-end gap-6">
        <nav className="flex items-center gap-4 text-sm font-medium">
          {items.map((item) => {
            const isActive = activePath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  py-1 border-b-2 transition-colors duration-300
                  ${isActive
                    ? `text-gray-900 ${variant === 'default' ? 'border-yellow-400' : 'border-secondary'} font-bold`
                    : `text-gray-600 border-transparent ${variant === 'default' ? 'hover:text-primary' : 'hover:text-secondary'}`
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
          onClick={onLogout}
          className="bg-transparent text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 font-bold"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>

      <div className="flex md:hidden!">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-xl md:hidden flex flex-col p-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2">
            {items.map((item) => {
              const isActive = activePath === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    px-4 py-3 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? `${variant === 'default' ? 'text-primary' : 'text-secondary'} font-bold`
                      : `text-gray-600 hover:bg-slate-50 ${variant === 'default' ? 'hover:text-primary' : 'hover:text-secondary'}`
                    }
                  `}
                >
                  {item.label}
                </a>
              );
            })}

            <div className="h-px bg-slate-100 my-2" />

            <Button
              size="sm"
              onClick={onLogout}
              className="justify-start px-4 py-3 bg-transparent text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 w-full font-bold"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}