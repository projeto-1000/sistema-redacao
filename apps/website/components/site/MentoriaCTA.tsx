import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
const fernando = "/images/fernando.jpg";

type Props = {
  variant?: "section" | "card";
  href?: string;
};

const bullets = [
  "9 semanas de aplicação guiada do método Redação em Camadas",
  "Protocolo que funciona sem depender de talento natural pra escrita",
  "Da folha em branco a uma estrutura repetível, prova após prova",
];

export function MentoriaCTA({
  variant = "section",
  href = "https://pay.hotmart.com/mentoria-projeto-1000",
}: Props) {
  return (
    <div className="on-navy relative overflow-hidden rounded-[2rem] shadow-[var(--shadow-card)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl float-blob"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-primary/40 blur-3xl"
      />

      <div className="relative grid items-center gap-8 p-8 sm:p-12 md:grid-cols-[1.35fr_1fr]">
        <div>
          <span className="pill bg-accent/15 text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Mentoria Projeto 1000
          </span>
          <h3
            className={`mt-5 font-display font-extrabold ${
              variant === "section"
                ? "text-3xl sm:text-5xl"
                : "text-2xl sm:text-4xl"
            }`}
          >
            Da correção ao resultado.{" "}
            <span className="text-accent">Em 9 semanas.</span>
          </h3>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/80">
            O Projeto 1000 corrige sua redação e mostra onde você trava. A
            Mentoria vai além: um acompanhamento de 9 semanas aplicando o método{" "}
            <span className="font-semibold text-foreground">
              Redação em Camadas
            </span>{" "}
            até a estrutura virar automática.
          </p>
          <ul className="mt-6 grid gap-3">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 text-sm text-foreground/85"
              >
                <span className="icon-bubble mt-0.5 h-6 w-6 bg-accent/20">
                  <Check className="h-3.5 w-3.5 text-accent" />
                </span>
                <span className="min-w-0">{b}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 font-display text-lg font-bold">
            Você não precisa de inspiração. Precisa de método.
          </p>
          <a
            href={href}
            data-cta="mentoria"
            className="press-fx arrow-slide mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-4 text-sm font-bold text-accent-foreground"
          >
            Quero entrar na Mentoria Projeto 1000
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Visual */}
        <div className="relative mx-auto w-full max-w-xs">
          <Image
            src={fernando}
            alt="Fernando Entratice, mentor do Projeto 1000"
            width={320}
            height={400}
            className="aspect-[4/5] w-full rounded-[1.5rem] object-cover shadow-2xl"
          />
          <span className="absolute -bottom-5 -left-4 grid h-24 w-24 place-items-center rounded-full bg-accent text-center font-display text-accent-foreground shadow-xl">
            <span className="leading-none">
              <span className="block text-2xl font-extrabold">9</span>
              <span className="block text-[10px] font-bold uppercase tracking-widest">
                semanas
              </span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
