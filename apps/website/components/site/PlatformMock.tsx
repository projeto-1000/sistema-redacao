import type { ReactNode } from "react";
import { Check, Target, PenLine } from "lucide-react";
import { COMPETENCIES } from "@repo/constants";

/** Moldura estilo janela da plataforma, para os mockups de tela. */
export function MockFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-[var(--shadow-card)]">
      <div className="border-border bg-secondary flex items-center gap-2 border-b px-4 py-3">
        <span className="bg-destructive/40 h-2.5 w-2.5 rounded-full" />
        <span className="bg-accent h-2.5 w-2.5 rounded-full" />
        <span className="bg-primary/50 h-2.5 w-2.5 rounded-full" />
        <span className="text-muted-foreground ml-2 truncate text-[10px] font-bold tracking-widest uppercase">
          {label}
        </span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

const competencyScores = [160, 200, 120, 160, 160];

/** Momento 1: avaliação por competência */
export function MockCompetencias() {
  return (
    <MockFrame label="Correção · Competências">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-foreground text-sm font-bold">Nota total</p>
        <p className="font-display text-primary text-3xl font-black">800</p>
      </div>
      <div className="mt-5 grid gap-3">
        {COMPETENCIES.map((competency, index) => (
          <div key={competency.id}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground font-bold">
                {competency.id}:{" "}
                <span className="text-muted-foreground font-medium">{competency.title}</span>
              </span>
              <span className="font-display text-foreground font-extrabold">
                {competencyScores[index]}
              </span>
            </div>
            <div className="bg-secondary mt-1.5 h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${((competencyScores[index] ?? 0) / 200) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-pastel-blue text-foreground/85 mt-5 rounded-xl p-4 text-xs leading-relaxed">
        <p className="text-primary mb-1 font-bold tracking-widest uppercase">
          Comentário do professor
        </p>
        O segundo parágrafo apresenta um exemplo relevante, mas não explica o que ele comprova
        dentro da sua tese.
      </div>
    </MockFrame>
  );
}

/** Momento 2: gargalo principal e próximos passos */
export function MockGargalo() {
  return (
    <MockFrame label="Correção · Gargalo e prioridades">
      <div className="border-accent/40 bg-pastel-yellow rounded-xl border p-4">
        <p className="text-accent-foreground flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
          <Target className="h-3.5 w-3.5" /> Principal gargalo
        </p>
        <p className="text-foreground mt-2 text-sm leading-snug font-semibold">
          Desenvolvimento dos argumentos: as ideias são apresentadas, mas não sustentadas até o fim.
        </p>
      </div>
      <p className="text-muted-foreground mt-5 text-[10px] font-bold tracking-widest uppercase">
        Próximos passos
      </p>
      <ul className="mt-3 grid gap-2.5">
        {[
          "Explicar a função de cada exemplo dentro do argumento",
          "Fechar o parágrafo retomando a tese",
          "Revisar conectivos entre o 2º e o 3º parágrafo",
        ].map((t) => (
          <li key={t} className="text-foreground/85 flex items-center gap-3 text-xs">
            <span className="icon-bubble bg-pastel-blue h-6 w-6 shrink-0">
              <Check className="text-primary h-3.5 w-3.5" />
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
      <p className="text-primary flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
        <PenLine className="h-3.5 w-3.5" /> Tarefa prática
      </p>
      <p className="text-foreground mt-2 text-sm leading-snug font-semibold">
        Reescreva o segundo parágrafo explicando o que o exemplo comprova.
      </p>
      <div className="bg-secondary text-muted-foreground mt-4 rounded-xl p-4 text-xs leading-relaxed">
        <span className="highlight-mark text-foreground">
          Um exemplo disso é a falta de saneamento em várias cidades brasileiras.
        </span>{" "}
        A situação segue sem solução até hoje.
      </div>
      <div className="border-primary/40 mt-3 rounded-xl border border-dashed p-4">
        <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
          Sua reescrita
        </p>
        <p className="text-foreground/80 mt-2 text-xs leading-relaxed">
          A falta de saneamento em várias cidades brasileiras mostra que o problema não é apenas
          econômico, mas de prioridade política, o que sustenta a tese de que…
          <span className="bg-primary ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5" />
        </p>
      </div>
    </MockFrame>
  );
}
