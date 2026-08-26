"use client";

import { useState } from "react";
import Image from "next/image";
import { Container } from "@/components/site/Container";
import { Check, ChevronDown } from "lucide-react";
import { MentoriaCTA } from "@/components/site/MentoriaCTA";
import { TiltCard } from "@/components/site/TiltCard";
const icone = "/images/projeto1000-icone.png";

export type PublicPlan = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  interval: string;
  intervalCount: number | null;
  discountPercentage: number | null;
  isRecommended: boolean;
  sortOrder: number;
  features: string[];
};

const brl = (cents: number) =>
  `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

const freePlan: PublicPlan = {
  id: "free",
  name: "Grátis",
  description: "Para conhecer a correção",
  priceCents: 0,
  interval: "lifetime",
  intervalCount: null,
  discountPercentage: null,
  isRecommended: false,
  sortOrder: -1,
  features: [
    "1 crédito gratuito para uma correção completa",
    "Correção individual feita por professor em 48 horas úteis",
    "Nota geral, comentários e avaliação nas cinco competências",
    "Principal gargalo, próximos passos e tarefa de reescrita",
    "Acesso ao dashboard",
  ],
};

const faq = [
  {
    q: "O que está incluído em um crédito?",
    a: "Cada crédito permite enviar uma redação e receber uma correção completa: avaliação nas cinco competências do Enem, comentários do professor, nota geral, principal gargalo, próximos passos e tarefa de reescrita.",
  },
  {
    q: "Em quanto tempo eu recebo a correção?",
    a: "A correção é enviada de volta em até 48h dentro de dias úteis.",
  },
  {
    q: "Como funciona o crédito gratuito?",
    a: "Ao criar sua conta, você recebe 1 crédito para enviar uma redação e conhecer a mesma correção completa oferecida nos planos pagos. Não é necessário informar cartão de crédito.",
  },
  {
    q: "Os créditos acumulam de um mês para o outro?",
    a: "Não. Os créditos incluídos na assinatura são renovados a cada ciclo, e os que não forem utilizados não passam para o mês seguinte. Créditos avulsos seguem uma regra diferente.",
  },
  {
    q: "Posso comprar créditos além dos incluídos no plano?",
    a: "Sim. Você pode comprar créditos avulsos sem precisar trocar de plano. Eles são adicionados separadamente ao seu saldo.",
  },
  {
    q: "A assinatura é renovada automaticamente?",
    a: "Sim. A assinatura mensal é renovada a cada mês e a trimestral, a cada 3 meses, até que seja cancelada.",
  },
  {
    q: "Posso trocar de plano?",
    a: "Sim. Quando a troca estiver disponível para a periodicidade atual, você poderá escolher outra oferta na plataforma.",
  },
  {
    q: "Existe fidelidade?",
    a: "Não. Você pode cancelar sua assinatura diretamente pela plataforma. O cancelamento impede a renovação e a cobrança do ciclo seguinte, e seu acesso permanece até o fim do período contratado.",
  },
];

interface PlanosContentProps {
  plans: PublicPlan[];
}

export function PlanosContent({ plans }: PlanosContentProps) {
  const [quarterly, setQuarterly] = useState(false);
  const hasQuarterlyPlans = plans.some(
    (plan) => plan.interval === "month" && plan.intervalCount === 3,
  );
  const quarterlyDiscounts = plans
    .filter((plan) => plan.interval === "month" && plan.intervalCount === 3)
    .map((plan) => plan.discountPercentage)
    .filter((discount): discount is number => discount !== null);
  const sharedQuarterlyDiscount =
    quarterlyDiscounts.length > 0 &&
    quarterlyDiscounts.every((discount) => discount === quarterlyDiscounts[0])
      ? quarterlyDiscounts[0]
      : null;
  const selectedPlans = plans.filter(
    (plan) =>
      plan.interval === "month" && plan.intervalCount === (quarterly ? 3 : 1),
  );
  const visiblePlans = [freePlan, ...selectedPlans];

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="float-blob pointer-events-none absolute -right-32 -top-28 -z-10 h-80 w-80 rounded-full bg-pastel-blue blur-3xl"
        />
        <Container className="py-16 sm:py-20">
          <h1 className="max-w-3xl font-display text-4xl font-extrabold text-foreground sm:text-6xl">
            Escolha o plano que acompanha seu ritmo de treino.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Comece com uma correção completa, sem pagar e sem informar cartão.
            Para continuar, escolha a oferta que melhor acompanha seu ritmo, sem
            fidelidade.
          </p>
        </Container>
      </section>

      <section>
        <Container className="pb-16 pt-4">
          {hasQuarterlyPlans && (
            <div className="flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-4 rounded-full border border-border bg-card px-5 py-3 shadow-[var(--shadow-soft)]">
                <span
                  className={`text-sm font-bold transition-colors ${
                    quarterly ? "text-muted-foreground" : "text-primary"
                  }`}
                >
                  Mensal
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={quarterly}
                  aria-label="Alternar entre cobrança mensal e trimestral"
                  onClick={() => setQuarterly((v) => !v)}
                  className={`relative h-7 w-14 shrink-0 rounded-full transition-colors ${
                    quarterly ? "bg-accent" : "bg-primary"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-all duration-300 ${
                      quarterly ? "left-8" : "left-1"
                    }`}
                  />
                </button>
                <span
                  className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                    quarterly ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Trimestral
                  {quarterlyDiscounts.length > 0 && (
                    <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
                      {sharedQuarterlyDiscount !== null
                        ? `-${sharedQuarterlyDiscount}%`
                        : "Economize"}
                    </span>
                  )}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Nas ofertas trimestrais, o valor total é cobrado a cada 3 meses.
              </p>
            </div>
          )}

          <div className="grid items-stretch gap-6 pt-10 md:grid-cols-3">
            {visiblePlans.map((p) => {
              const isFree = p.id === "free";
              const isQuarterly =
                p.interval === "month" && p.intervalCount === 3;
              const displayedPrice = isQuarterly
                ? Math.round(p.priceCents / (p.intervalCount ?? 1))
                : p.priceCents;

              return (
                <TiltCard
                  key={p.id}
                  intensity={6}
                  className={`relative flex h-full flex-col rounded-[1.75rem] bg-card p-8 ${
                    p.isRecommended
                      ? "border-2 border-primary shadow-[var(--shadow-card)]"
                      : "border border-border shadow-[var(--shadow-soft)]"
                  }`}
                >
                  {p.isRecommended && (
                    <span className="absolute -top-3 left-8 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-[0_8px_20px_-8px_rgba(25,96,234,0.8)]">
                      <Image
                        src={icone}
                        alt=""
                        width={16}
                        height={16}
                        className="h-4 w-4 rounded-full"
                      />
                      Recomendado
                    </span>
                  )}
                  <h2 className="mt-2 font-display text-2xl font-extrabold text-card-foreground">
                    {p.name}
                  </h2>
                  {p.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                  <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-4xl font-extrabold text-card-foreground">
                      {brl(displayedPrice)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isFree ? "sem cartão de crédito" : "por mês"}
                    </span>
                  </p>
                  {isQuarterly && (
                    <p className="mt-1 text-xs font-semibold text-primary">
                      {brl(p.priceCents)} cobrados a cada 3 meses
                      {p.discountPercentage !== null &&
                        `, ${p.discountPercentage}% de desconto`}
                    </p>
                  )}
                  <ul className="mt-7 flex-1 space-y-3.5">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-3 text-sm text-foreground/90"
                      >
                        <span className="icon-bubble h-6 w-6 shrink-0 bg-pastel-blue">
                          <Check className="h-3.5 w-3.5 text-primary" />
                        </span>
                        <span className="min-w-0">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/cadastro"
                    data-cta={`plan-${p.name.toLowerCase()}`}
                    className={`press-fx mt-8 inline-flex justify-center rounded-full px-5 py-3.5 text-sm font-bold transition-all ${
                      p.isRecommended
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {isFree ? "Começar grátis" : `Assinar ${p.name}`}
                  </a>
                </TiltCard>
              );
            })}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Créditos avulsos também podem ser comprados fora da assinatura.
            Cancele quando quiser, sem fidelidade.
          </p>

          <div className="mt-14">
            <MentoriaCTA
              variant="card"
              href="https://pay.hotmart.com/C105831175G?utm_source=site&utm_medium=organico&utm_campaign=site_projeto1000_planos&src=site_projeto1000_planos"
            />
          </div>
        </Container>
      </section>

      <section className="bg-secondary">
        <Container className="py-20">
          <h2 className="font-display text-3xl font-extrabold text-foreground">
            Dúvidas sobre os planos
          </h2>
          <div className="mt-8 space-y-3">
            {faq.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] open:border-primary/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold text-card-foreground marker:hidden">
                  <span className="min-w-0">{f.q}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
