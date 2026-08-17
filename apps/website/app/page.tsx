import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Projeto 1000 | Correção que te mostra a direção",
  description:
    "Correção humana de redação nas cinco competências do Enem, com principal gargalo, próximos passos e tarefa de reescrita. Primeira correção gratuita.",
};
import { ArrowRight, ArrowDown, Check } from "lucide-react";
import { Container } from "@/components/site/Container";
import { CTAButton } from "@/components/site/CTAButton";
import { NumberedCard } from "@/components/site/NumberedCard";
import { Reveal } from "@/components/site/Reveal";
import { CadernoMockup } from "@/components/site/CadernoMockup";
import { EvolutionChart } from "@/components/site/EvolutionChart";
import {
  MockCompetencias,
  MockGargalo,
  MockReescrita,
} from "@/components/site/PlatformMock";
const fernando = "/images/fernando.jpg";

const pilares = [
  {
    n: "01",
    title: "Entenda sua nota",
    body: "Veja seu desempenho nas cinco competências, com comentários específicos do professor e avaliação geral da redação.",
  },
  {
    n: "02",
    title: "Identifique sua prioridade",
    body: "O professor indica seu principal gargalo do texto, e você recebe também uma lista curta de próximos passos.",
  },
  {
    n: "03",
    title: "Transforme correção em prática",
    body: "Receba tarefas de reescrita construídas a partir dos problemas encontrados na sua própria redação.",
  },
  {
    n: "04",
    title: "Acompanhe sua evolução",
    body: "Consulte sua média geral e por competência, compare seus resultados e acompanhe o histórico das suas redações.",
  },
];

const momentos = [
  {
    title: "Avaliação por competência",
    body: "Veja sua nota em cada uma das cinco competências do Enem, acompanhada pelos comentários específicos do professor e por uma avaliação geral da redação.",
    mock: <MockCompetencias />,
  },
  {
    title: "Principal gargalo e próximos passos",
    body: "A correção destaca o problema que mais limita o texto e organiza uma lista curta de prioridades para orientar seu próximo estudo.",
    mock: <MockGargalo />,
  },
  {
    title: "Tarefas de reescrita",
    body: "A partir dos problemas encontrados na redação, a correção propõe tarefas práticas para que você trabalhe diretamente no texto corrigido.",
    mock: <MockReescrita />,
  },
];

const depoimentos = [
  {
    q: "Eu geralmente recebia a nota, lia os comentários e ficava sem saber o que fazer com aquilo. Dessa vez, teve uma observação sobre o segundo parágrafo que me fez voltar ao texto e perceber que eu tinha dado um exemplo, mas não tinha explicado o que ele provava. Era uma coisa que eu não tinha enxergado enquanto escrevia.",
    nome: "Marina A.",
    cidade: "Campinas (SP)",
  },
  {
    q: "O que mais me surpreendeu foi que a introdução, que eu achava ser a pior parte, não era o principal problema do texto. Eu estava me esforçando no lugar errado.",
    nome: "Lucas R.",
    cidade: "Belo Horizonte (MG)",
  },
  {
    q: "Quando fui rever meu texto, percebi que algumas partes que pareciam claras para mim não estavam desenvolvidas. Foi bom reescrever, foi a primeira vez que eu soube exatamente qual trecho eu precisava mudar.",
    nome: "Júlia M.",
    cidade: "Recife (PE)",
  },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="float-blob absolute -left-32 -top-24 h-80 w-80 rounded-full bg-pastel-blue blur-3xl" />
          <div
            className="float-blob absolute -right-24 top-32 h-80 w-80 rounded-full bg-pastel-yellow blur-3xl"
            style={{ animationDelay: "-4s" }}
          />
        </div>

        <Container className="relative grid gap-12 py-14 md:grid-cols-[1.1fr_1fr] md:items-center md:py-24">
          <div>
            <Reveal>
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
                Correção que te mostra a{" "}
                <span className="text-primary">direção</span>
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                O Projeto 1000 corrige sua redação nas cinco competências do
                Enem, identifica o que mais está travando sua evolução e mostra
                exatamente o que fazer a seguir.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CTAButton href="/cadastro" dataCta="signup-hero">
                  <span className="arrow-slide">
                    Corrigir minha redação grátis{" "}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </CTAButton>
                <a
                  href="#plataforma"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-primary/50 hover:text-primary"
                >
                  Ver como funciona <ArrowDown className="h-4 w-4" />
                </a>
              </div>
            </Reveal>
            <Reveal delay={260}>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {[
                  "1 crédito grátis",
                  "Sem cartão de crédito",
                  "Correção 100% humana",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <CadernoMockup />
          </Reveal>
        </Container>
      </section>

      {/* 4 ETAPAS */}
      <section className="border-t border-border">
        <Container className="py-20">
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
                Quatro etapas para que sua correção se transforme em caminho
              </h2>
              <p className="mt-4 text-muted-foreground">
                Entenda sua nota, identifique o que melhorar primeiro,
                transforme a orientação em prática e acompanhe sua evolução.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {pilares.map((p, i) => (
              <Reveal key={p.n} delay={i * 100}>
                <div className="h-full">
                  <NumberedCard number={p.n} title={p.title}>
                    <p>{p.body}</p>
                  </NumberedCard>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* POR DENTRO DO PROJETO */}
      <section id="plataforma" className="scroll-mt-24 bg-secondary">
        <Container className="py-20">
          <Reveal>
            <div className="max-w-3xl">
              <span className="pill bg-pastel-blue text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Por dentro do Projeto 1000
              </span>
              <h2 className="mt-6 font-display text-3xl font-extrabold text-foreground sm:text-5xl">
                Veja como é a sua correção no Projeto 1000.
              </h2>
              <p className="mt-5 text-muted-foreground">
                Notas, comentários, gargalo, prioridades e tarefas de reescrita
                aparecem reunidos no mesmo lugar.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-14">
            {momentos.map((m, i) => (
              <Reveal key={m.title} delay={80}>
                <div className="grid items-center gap-8 md:grid-cols-[1fr_1.05fr]">
                  <div>
                    <span className="font-display text-sm font-extrabold text-primary/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
                      {m.title}
                    </h3>
                    <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
                      {m.body}
                    </p>
                  </div>
                  <div>{m.mock}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* HISTÓRICO E EVOLUÇÃO */}
      <section>
        <Container className="grid gap-12 py-20 md:grid-cols-[1fr_1.1fr] md:items-center">
          <Reveal>
            <div>
              <span className="pill bg-pastel-blue text-primary">
                Histórico e evolução
              </span>
              <h2 className="mt-5 font-display text-3xl font-extrabold text-foreground sm:text-5xl">
                Veja como seu desempenho muda ao longo das redações.
              </h2>
              <p className="mt-5 max-w-lg text-muted-foreground">
                O dashboard reúne suas notas, médias e correções anteriores para
                que você acompanhe seu desempenho geral e em cada competência ao
                longo do tempo.
              </p>
              <ul className="mt-6 grid gap-3 text-sm text-foreground/85">
                {[
                  "Média geral e por competência",
                  "Evolução das notas ao longo das redações",
                  "Histórico completo de redações e correções",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="icon-bubble h-6 w-6 shrink-0 bg-pastel-blue">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <span className="min-w-0">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <EvolutionChart />
          </Reveal>
        </Container>
      </section>

      {/* CORREÇÃO HUMANA */}
      <section className="bg-secondary">
        <Container className="grid items-center gap-12 py-20 md:grid-cols-[auto_1fr]">
          <Reveal>
            <div className="mx-auto md:mx-0">
              <div className="relative">
                <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-pastel-yellow" />
                <Image
                  src={fernando}
                  alt="Fernando Entratice, professor de redação e criador do Projeto 1000"
                  width={240}
                  height={288}
                  className="h-72 w-60 rounded-[1.75rem] object-cover shadow-[var(--shadow-card)]"
                />
              </div>
              <p className="mt-6 font-display text-lg font-extrabold uppercase tracking-wide text-foreground">
                Fernando Entratice
              </p>
              <p className="mt-1 max-w-[15rem] text-sm text-muted-foreground">
                Professor de redação e criador do Projeto 1000
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="max-w-2xl">
              <span className="pill bg-pastel-yellow text-foreground">
                Correção humana e individual
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-5xl">
                Cada redação é corrigida individualmente por um{" "}
                <span className="highlight-mark highlight-thick">
                  professor
                </span>
                .
              </h2>
              <p className="mt-5 max-w-xl text-muted-foreground">
                O sistema de correção do Projeto 1000 foi criado a partir de 14
                anos de experiência com leitura, avaliação e ensino de redação.
              </p>
              <p className="mt-4 max-w-xl text-muted-foreground">
                A leitura considera o texto por inteiro, da construção dos
                argumentos à proposta de intervenção, para produzir comentários
                específicos, identificar o principal gargalo e orientar os
                próximos passos. Sempre de forma individualizada.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* DEPOIMENTOS */}
      <section>
        <Container className="py-20">
          <Reveal>
            <div className="max-w-3xl">
              <h2 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
                Relatos de alunos
              </h2>
              <p className="mt-4 text-muted-foreground">
                Quem já recebeu uma correção do Projeto 1000 conta como foi a
                experiência.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {depoimentos.map((t, i) => (
              <Reveal key={t.nome} delay={i * 100}>
                <figure className="press-fx h-full rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
                  <span
                    aria-hidden
                    className="block font-display text-5xl leading-none text-accent"
                  >
                    “
                  </span>
                  <blockquote className="mt-3 text-base leading-relaxed text-foreground/90">
                    {t.q}
                  </blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="block font-bold text-foreground">
                      {t.nome}
                    </span>
                    <span className="text-muted-foreground">{t.cidade}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA FINAL */}
      <section>
        <Container className="py-20">
          <Reveal>
            <div className="on-navy relative overflow-hidden rounded-[2rem] p-10 text-center shadow-[var(--shadow-card)] md:p-14">
              <div className="float-blob pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
              <h2 className="relative font-display text-3xl font-extrabold sm:text-4xl">
                Comece pela primeira correção gratuita. Descubra seu caminho
              </h2>
              <p className="relative mx-auto mt-4 max-w-2xl text-foreground/75">
                1 crédito grátis, sem cartão de crédito. Escreva, envie e receba
                o diagnóstico do seu texto.
              </p>
              <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href="/cadastro"
                  data-cta="signup-final"
                  className="press-fx inline-flex items-center justify-center rounded-full bg-accent px-7 py-4 text-sm font-bold text-accent-foreground"
                >
                  Corrigir grátis agora
                </a>
                <a
                  href="/planos"
                  className="press-fx inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-4 text-sm font-bold text-foreground hover:border-accent hover:text-accent"
                >
                  Ver planos
                </a>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
