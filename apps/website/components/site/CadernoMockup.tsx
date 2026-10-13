/**
 * Mockup autoral do hero — folha de caderno com redação
 * corrigida à mão: rabiscos vermelhos, marca-texto amarelo,
 * anotação lateral do professor.
 */
export function CadernoMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md transition-transform duration-500 hover:rotate-0 sm:rotate-[1.4deg]">
      {/* Sombra papel */}
      <div aria-hidden className="bg-pastel-blue absolute -inset-4 -z-10 rounded-[2rem] blur-2xl" />

      {/* Folha */}
      <div
        className="paper-block border-border relative overflow-hidden rounded-2xl border shadow-[var(--shadow-card)]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 27px, color-mix(in oklab, var(--paper-ink) 12%, transparent) 27px 28px)",
        }}
      >
        {/* Margem vertical vermelha */}
        <span aria-hidden className="absolute top-0 left-10 h-full w-px bg-red-500/70" />

        {/* Furos do fichário */}
        <span
          aria-hidden
          className="absolute top-8 left-3 h-3 w-3 rounded-full border border-[color:var(--paper-ink)]/20 bg-[color:var(--paper)]"
        />
        <span
          aria-hidden
          className="absolute top-1/2 left-3 h-3 w-3 -translate-y-1/2 rounded-full border border-[color:var(--paper-ink)]/20 bg-[color:var(--paper)]"
        />
        <span
          aria-hidden
          className="absolute bottom-8 left-3 h-3 w-3 rounded-full border border-[color:var(--paper-ink)]/20 bg-[color:var(--paper)]"
        />

        <div className="relative py-8 pr-6 pl-14">
          {/* Cabeçalho */}
          <div className="flex items-baseline justify-between border-b border-dashed border-[color:var(--paper-ink)]/25 pb-2">
            <span className="font-display text-xs font-black tracking-[0.25em] uppercase">
              Redação · Enem
            </span>
            <span className="font-display text-xs font-bold text-red-600">21/07</span>
          </div>

          {/* Título com marca-texto */}
          <h3 className="font-display mt-4 text-base leading-tight font-bold">
            Tema: <span className="highlight-mark highlight-thick">O papel da educação</span> no
            combate à desigualdade.
          </h3>

          {/* Linhas de "texto" */}
          <div className="mt-5 space-y-[10px]">
            {["w-full", "w-11/12", "w-10/12", "w-full", "w-9/12"].map((w, i) => (
              <div key={i} className="relative">
                <span
                  className={`block h-[2px] rounded-full bg-[color:var(--paper-ink)]/75 ${w}`}
                />
                {i === 1 && (
                  <span
                    aria-hidden
                    className="bg-accent/60 absolute -top-1 left-6 h-[10px] w-24 rounded-sm"
                  />
                )}
                {i === 3 && (
                  <span
                    aria-hidden
                    className="font-display absolute -top-2 right-8 text-lg leading-none text-red-600"
                    style={{ transform: "rotate(-4deg)" }}
                  >
                    ✗
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Bloco "gargalo" — post-it amarelo */}
          <div
            className="sticker-tilt-right bg-accent relative mt-6 rounded-[3px] p-4 shadow-lg"
            style={{
              boxShadow: "0 12px 24px -12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            <p className="font-display text-accent-foreground text-[10px] font-black tracking-widest uppercase">
              Gargalo principal
            </p>
            <p className="text-accent-foreground mt-1 text-[13px] leading-tight">
              A proposta de intervenção não articula agente e meio de execução.
            </p>
            {/* Fita adesiva */}
            <span
              aria-hidden
              className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-[-3deg] bg-[color:var(--paper-ink)]/15"
            />
          </div>

          {/* Anotação vermelha à mão */}
          <p
            className="mt-5 font-serif text-sm leading-snug text-red-600 italic"
            style={{ transform: "rotate(-1.2deg)" }}
          >
            &ldquo;Bom repertório! Reveja a Comp. 5: qual ação prática você propõe?&rdquo;
          </p>

          {/* Rodapé com nota */}
          <div className="mt-5 flex items-center justify-between border-t border-dashed border-[color:var(--paper-ink)]/25 pt-3">
            <span className="muted-ink text-[11px] font-semibold tracking-widest uppercase">
              Prof. Entratice
            </span>
            <span
              className="font-display relative text-3xl leading-none font-black text-red-600"
              style={{ transform: "rotate(-3deg)" }}
            >
              920
              <span
                aria-hidden
                className="absolute -inset-1 -z-10 rounded-full border-2 border-red-600/70"
                style={{ transform: "rotate(6deg)" }}
              />
            </span>
          </div>
        </div>
      </div>

      {/* Clipe metálico */}
      <span
        aria-hidden
        className="border-foreground/40 absolute -top-3 left-16 h-10 w-6 rotate-[8deg] rounded-b-[3px] border-2 border-b-0 bg-transparent shadow-md"
      />
    </div>
  );
}
