"use client";

import { ArrowRight, Menu, X } from "lucide-react";
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

export function Navbar() {
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
      className={`sticky top-0 z-50 border-b bg-background/90 backdrop-blur-xl transition-all duration-300 ${scrolled ? "border-border shadow-[0_4px_24px_-16px_rgba(11,17,35,0.35)]" : "border-transparent"}`}
    >
      <Container
        className={`flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? "h-16" : "h-20"}`}
      >
        <Link
          href="/"
          aria-label="Projeto 1000: página inicial"
          onClick={() => setOpen(false)}
        >
          <BrandWordmark height={scrolled ? 30 : 38} />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`story-link text-sm font-semibold transition-colors hover:text-primary ${pathname.startsWith(link.href) ? "text-primary" : "text-foreground/70"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/cadastro"
            data-cta="signup"
            className="press-fx arrow-slide hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground md:inline-flex"
          >
            Corrigir grátis <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-label="Abrir menu"
            className="grid h-11 w-11 place-items-center rounded-full border border-border text-foreground md:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-4 py-3 text-base font-semibold hover:bg-secondary ${pathname.startsWith(link.href) ? "bg-secondary text-primary" : "text-foreground/85"}`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/cadastro"
              onClick={() => setOpen(false)}
              className="press-fx mt-2 inline-flex justify-center rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground"
            >
              Corrigir grátis
            </Link>
          </Container>
        </div>
      )}
    </header>
  );
}
