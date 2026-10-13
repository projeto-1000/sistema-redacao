"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown, Ellipsis, LogOut, Menu, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Logo } from "./logo";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

export interface HeaderNavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  group?: string;
  desktopPlacement?: "primary" | "overflow" | "account";
}

interface HeaderProps {
  items: HeaderNavItem[];
  activePath?: string;
  onLogout: () => Promise<void>;
  collapseAt?: "md" | "lg" | "xl";
}

const RESPONSIVE_CLASSES = {
  md: {
    desktop: "hidden md:flex",
    mobile: "flex md:hidden",
    sheet: "md:hidden",
  },
  lg: {
    desktop: "hidden lg:flex",
    mobile: "flex lg:hidden",
    sheet: "lg:hidden",
  },
  xl: {
    desktop: "hidden xl:flex",
    mobile: "flex xl:hidden",
    sheet: "xl:hidden",
  },
} as const;

const DESKTOP_MEDIA_QUERIES = {
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
} as const;

function isItemActive(activePath: string, href: string) {
  if (href === "/") return activePath === href;
  return activePath === href || activePath.startsWith(`${href}/`);
}

export function Header({
  items,
  activePath = "",
  onLogout,
  collapseAt = "md",
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const responsiveClasses = RESPONSIVE_CLASSES[collapseAt];
  const primaryItems = items.filter(
    (item) => !item.desktopPlacement || item.desktopPlacement === "primary",
  );
  const overflowItems = items.filter(
    (item) => item.desktopPlacement === "overflow",
  );
  const accountItem = items.find((item) => item.desktopPlacement === "account");
  const hasActiveOverflowItem = overflowItems.some((item) =>
    isItemActive(activePath, item.href),
  );

  const mobileGroups = useMemo(() => {
    const groups = new Map<string, HeaderNavItem[]>();

    items.forEach((item) => {
      const group = item.group ?? "Menu";
      groups.set(group, [...(groups.get(group) ?? []), item]);
    });

    return Array.from(groups.entries());
  }, [items]);

  useEffect(() => {
    const desktopMedia = window.matchMedia(DESKTOP_MEDIA_QUERIES[collapseAt]);
    const closeMenuOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMobileMenuOpen(false);
    };

    desktopMedia.addEventListener("change", closeMenuOnDesktop);
    return () => desktopMedia.removeEventListener("change", closeMenuOnDesktop);
  }, [collapseAt]);

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
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 shadow-sm backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center">
        <a href="/" className="shrink-0" aria-label="Ir para o início">
          <Logo className="h-10 w-auto" />
        </a>
      </div>

      <div
        className={`${responsiveClasses.desktop} items-center justify-end gap-4`}
      >
        <nav
          aria-label="Navegação principal"
          className="flex items-center gap-3 text-sm font-medium"
        >
          {primaryItems.map((item) => {
            const isActive = isItemActive(activePath, item.href);

            return (
              <a
                key={item.href}
                href={item.href}
                data-active={isActive}
                className={`story-link whitespace-nowrap transition-colors duration-300 ${
                  isActive ? "font-bold" : "text-slate-600 hover:text-primary"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {overflowItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  hasActiveOverflowItem ? "text-primary" : "text-slate-700"
                }`}
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Ellipsis className="size-4" />
                </span>
                Mais
                <ChevronDown className="size-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="min-w-44 rounded-xl border-slate-200 p-1.5 shadow-lg"
            >
              {overflowItems.map((item) => (
                <DropdownMenuItem
                  key={item.href}
                  asChild
                  className={`rounded-lg px-3 py-2.5 font-medium ${
                    isItemActive(activePath, item.href)
                      ? "bg-blue-50 text-primary focus:bg-blue-50 focus:text-primary"
                      : "text-slate-700"
                  }`}
                >
                  <a href={item.href}>{item.label}</a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {accountItem && (
          <a
            href={accountItem.href}
            className={`flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-2.5 text-sm font-semibold transition-colors hover:bg-slate-100 ${
              isItemActive(activePath, accountItem.href)
                ? "text-primary"
                : "text-slate-700"
            }`}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-slate-100">
              <UserRound className="size-4" />
            </span>
            {accountItem.label}
          </a>
        )}

        <Button
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          isLoading={isLoggingOut}
          loadingText="Saindo..."
          aria-label="Sair"
          className="size-10 gap-0 bg-transparent p-0 font-bold text-red-500 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="size-4" />
        </Button>
      </div>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <div
          className={`${responsiveClasses.mobile} shrink-0 items-center gap-2`}
        >
          {accountItem && (
            <a
              href={accountItem.href}
              className="flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-slate-100">
                <UserRound className="size-4" />
              </span>
              {accountItem.label}
            </a>
          )}
          <SheetTrigger asChild>
            <button
              type="button"
              disabled={isLoggingOut}
              className="flex h-10 items-center gap-2 rounded-xl bg-primary/5 px-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-50"
            >
              <Menu className="size-4 text-primary" />
              <span>Menu</span>
            </button>
          </SheetTrigger>
        </div>

        <SheetContent
          className={`w-[min(22rem,calc(100vw-1rem))] gap-0 overflow-hidden border-l-slate-200 p-0 ${responsiveClasses.sheet}`}
        >
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Acesse as áreas disponíveis da aplicação.
          </SheetDescription>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-slate-100 px-6 py-5 pr-14">
              <Logo className="h-10 w-auto" />
            </div>

            <nav
              aria-label="Menu de navegação"
              className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5"
            >
              {mobileGroups.map(([group, groupItems]) => (
                <div key={group}>
                  <p className="px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {group}
                  </p>
                  <div className="mt-2 space-y-1">
                    {groupItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = isItemActive(activePath, item.href);

                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                            isActive
                              ? "bg-primary/10 text-slate-900"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {Icon ? (
                            <Icon
                              className={`size-4.5 shrink-0 ${isActive ? "text-primary" : ""}`}
                            />
                          ) : null}
                          <span>{item.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="shrink-0 border-t border-slate-100 p-4">
              <Button
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                isLoading={isLoggingOut}
                loadingText="Saindo..."
                className="h-11 w-full justify-start gap-3 rounded-xl bg-transparent px-3 font-bold text-red-500 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="size-4.5" />
                Sair
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
