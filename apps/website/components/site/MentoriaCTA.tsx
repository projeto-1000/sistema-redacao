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
        className="bg-accent/20 float-blob pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="bg-primary/40 pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full blur-3xl"
      />

      <div className="relative grid items-center gap-8 p-8 sm:p-12 md:grid-cols-[1.35fr_1fr]">
        <div>
          <span className="pill bg-accent/15 text-accent">
            <span className="bg-accent h-1.5 w-1.5 rounded-full" />
            Mentoria Projeto 1000
          </span>
          <h3
            className={`font-display mt-5 font-extrabold ${
              variant === "section" ? "text-3xl sm:text-5xl" : "text-2xl sm:text-4xl"
            }`}
          >
            Da correção ao resultado. <span className="text-accent">Em 9 semanas.</span>
          </h3>
          <p className="text-foreground/80 mt-5 max-w-xl text-base leading-relaxed">
            O Projeto 1000 corrige sua redação e mostra onde você trava. A Mentoria vai além: um
            acompanhamento de 9 semanas aplicando o método{" "}
            <span className="text-foreground font-semibold">Redação em Camadas</span> até a
            estrutura virar automática.
          </p>
          <ul className="mt-6 grid gap-3">
            {bullets.map((b) => (
              <li key={b} className="text-foreground/85 flex items-start gap-3 text-sm">
                <span className="icon-bubble bg-accent/20 mt-0.5 h-6 w-6">
                  <Check className="text-accent h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">{b}</span>
              </li>
            ))}
          </ul>
          <p className="font-display mt-6 text-lg font-bold">
            Você não precisa de inspiração. Precisa de método.
          </p>
          <a
            href={href}
            data-cta="mentoria"
            className="press-fx arrow-slide bg-accent text-accent-foreground mt-7 inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-bold"
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
          <span className="bg-accent font-display text-accent-foreground absolute -bottom-5 -left-4 grid h-24 w-24 place-items-center rounded-full text-center shadow-xl">
            <span className="leading-none">
              <span className="block text-2xl font-extrabold">9</span>
              <span className="block text-[10px] font-bold tracking-widest uppercase">semanas</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
