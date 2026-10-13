"use client";

import { ArrowRight, LogIn, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandWordmark } from "./BrandWordmark";
import { Container } from "./Container";

const links = [
  { href: "/como-funciona", label: "Como Funciona" },
  { href: "/planos", label: "Planos" },
  { href: "/sobre", label: "Sobre" },
] as const;

interface NavbarProps {
  loginUrl: string;
}

export function Navbar({ loginUrl }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`bg-background/90 sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${scrolled ? "border-border shadow-[0_4px_24px_-16px_rgba(11,17,35,0.35)]" : "border-transparent"}`}
    >
      <Container
        className={`flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? "h-16" : "h-20"}`}
      >
        <Link href="/" aria-label="Projeto 1000: página inicial" onClick={() => setOpen(false)}>
          <BrandWordmark height={scrolled ? 30 : 38} />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`story-link hover:text-primary text-sm font-semibold transition-colors ${pathname.startsWith(link.href) ? "text-primary" : "text-foreground/70"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/cadastro"
            data-cta="signup"
            className="press-fx arrow-slide bg-primary text-primary-foreground hidden items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold md:inline-flex"
          >
            Corrigir grátis <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={loginUrl}
            className="press-fx border-primary text-primary hover:bg-primary/10 hidden items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors md:inline-flex"
          >
            Entrar <LogIn className="h-4 w-4" />
          </a>
          <button
            type="button"
            aria-label="Abrir menu"
            className="border-border text-foreground grid h-11 w-11 place-items-center rounded-full border md:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>
      {open && (
        <div className="border-border bg-background border-t md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`hover:bg-secondary rounded-xl px-4 py-3 text-base font-semibold ${pathname.startsWith(link.href) ? "bg-secondary text-primary" : "text-foreground/85"}`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/cadastro"
              onClick={() => setOpen(false)}
              className="press-fx bg-primary text-primary-foreground mt-2 inline-flex justify-center rounded-full px-5 py-3.5 text-sm font-semibold"
            >
              Corrigir grátis
            </Link>
            <a
              href={loginUrl}
              onClick={() => setOpen(false)}
              className="press-fx border-primary text-primary mt-1 inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3.5 text-sm font-semibold"
            >
              Entrar <LogIn className="h-4 w-4" />
            </a>
          </Container>
        </div>
      )}
    </header>
  );
}
