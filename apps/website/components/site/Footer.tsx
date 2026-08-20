import { Instagram, Mail } from "lucide-react";
import Link from "next/link";
import { BrandWordmark } from "./BrandWordmark";
import { Container } from "./Container";

export function Footer() {
  const navigationLinks: Array<[string, string]> = [
    ["/", "Início"],
    ["/como-funciona", "Como Funciona"],
    ["/planos", "Planos"],
    ["/sobre", "Sobre"],
  ];

  return (
    <footer className="on-navy mt-24">
      <Container className="grid gap-10 py-16 md:grid-cols-4">
        <div>
          <BrandWordmark variant="escuro" height={64} />
          <p className="mt-4 text-sm font-semibold text-accent">
            Correção que gera direção.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Navegação
          </h4>
          <ul className="space-y-2 text-sm">
            {navigationLinks.map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-foreground/80 hover:text-accent"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Contato
          </h4>
          <a
            href="mailto:contato@projeto1000.com.br"
            className="flex items-center gap-2 text-sm text-foreground/80 hover:text-accent"
          >
            <Mail className="h-4 w-4" />
            contato@projeto1000.com.br
          </a>
          <a
            href="https://www.instagram.com/fernandoentratice"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-foreground/80 hover:text-accent"
          >
            <Instagram className="h-5 w-5" />
            <span className="text-sm">@fernandoentratice</span>
          </a>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Legal
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/termos"
                className="text-foreground/80 hover:text-accent"
              >
                Termos de Uso
              </Link>
            </li>
            <li>
              <Link
                href="/privacidade"
                className="text-foreground/80 hover:text-accent"
              >
                Política de Privacidade
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-border">
        <Container className="flex flex-col items-start justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Projeto 1000 · Entratice. Todos os
            direitos reservados.
          </p>
          <p>Correção humana e individual de redação para o Enem.</p>
        </Container>
      </div>
    </footer>
  );
}
