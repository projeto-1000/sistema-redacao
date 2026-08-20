import type { ReactNode } from "react";
import { Check, Target, PenLine } from "lucide-react";

/** Moldura estilo janela da plataforma, para os mockups de tela. */
export function MockFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
        <span className="ml-2 truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

const competencias = [
  { c: "C1", nome: "Norma padrão", nota: 160 },
  { c: "C2", nome: "Compreensão do tema", nota: 200 },
  { c: "C3", nome: "Argumentação", nota: 120 },
  { c: "C4", nome: "Coesão", nota: 160 },
  { c: "C5", nome: "Proposta de intervenção", nota: 160 },
];

/** Momento 1: avaliação por competência */
export function MockCompetencias() {
  return (
    <MockFrame label="Correção · Competências">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-sm font-bold text-foreground">
          Nota total
        </p>
        <p className="font-display text-3xl font-black text-primary">800</p>
      </div>
      <div className="mt-5 grid gap-3">
        {competencias.map((c) => (
          <div key={c.c}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">
                {c.c}{" "}
                <span className="font-medium text-muted-foreground">
                  {c.nome}
                </span>
              </span>
              <span className="font-display font-extrabold text-foreground">
                {c.nota}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(c.nota / 200) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-pastel-blue p-4 text-xs leading-relaxed text-foreground/85">
        <p className="mb-1 font-bold uppercase tracking-widest text-primary">
          Comentário do professor
        </p>
        O segundo parágrafo apresenta um exemplo relevante, mas não explica o
        que ele comprova dentro da sua tese.
      </div>
    </MockFrame>
  );
}

/** Momento 2: gargalo principal e próximos passos */
export function MockGargalo() {
  return (
    <MockFrame label="Correção · Gargalo e prioridades">
      <div className="rounded-xl border border-accent/40 bg-pastel-yellow p-4">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
          <Target className="h-3.5 w-3.5" /> Principal gargalo
        </p>
        <p className="mt-2 text-sm font-semibold leading-snug text-foreground">
          Desenvolvimento dos argumentos: as ideias são apresentadas, mas não
          sustentadas até o fim.
        </p>
      </div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Próximos passos
      </p>
      <ul className="mt-3 grid gap-2.5">
        {[
          "Explicar a função de cada exemplo dentro do argumento",
          "Fechar o parágrafo retomando a tese",
          "Revisar conectivos entre o 2º e o 3º parágrafo",
        ].map((t) => (
          <li
            key={t}
            className="flex items-center gap-3 text-xs text-foreground/85"
          >
            <span className="icon-bubble h-6 w-6 shrink-0 bg-pastel-blue">
              <Check className="h-3.5 w-3.5 text-primary" />
            </span>
            <span className="min-w-0">{t}</span>
          </li>
        ))}
      </ul>
    </MockFrame>
  );
}

/** Momento 3: tarefa de reescrita */
export function MockReescrita() {
  return (
    <MockFrame label="Correção · Tarefa de reescrita">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
        <PenLine className="h-3.5 w-3.5" /> Tarefa prática
      </p>
      <p className="mt-2 text-sm font-semibold leading-snug text-foreground">
        Reescreva o segundo parágrafo explicando o que o exemplo comprova.
      </p>
      <div className="mt-4 rounded-xl bg-secondary p-4 text-xs leading-relaxed text-muted-foreground">
        <span className="highlight-mark text-foreground">
          Um exemplo disso é a falta de saneamento em várias cidades
          brasileiras.
        </span>{" "}
        A situação segue sem solução até hoje.
      </div>
      <div className="mt-3 rounded-xl border border-dashed border-primary/40 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Sua reescrita
        </p>
        <p className="mt-2 text-xs leading-relaxed text-foreground/80">
          A falta de saneamento em várias cidades brasileiras mostra que o
          problema não é apenas econômico, mas de prioridade política, o que
          sustenta a tese de que…
          <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-primary" />
        </p>
      </div>
    </MockFrame>
  );
}
