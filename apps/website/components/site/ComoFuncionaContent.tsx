"use client";

import { Container } from "@/components/site/Container";
import { CTAButton } from "@/components/site/CTAButton";
import { Reveal } from "@/components/site/Reveal";
import { ScrollTimeline } from "@/components/site/ScrollTimeline";
import {
  BookOpen,
  PenLine,
  ClipboardCheck,
  Target,
  RefreshCcw,
  LineChart,
} from "lucide-react";

const steps = [
  {
    icon: BookOpen,
    title: "Escolha uma proposta",
    body: "Explore o catálogo por eixo temático ou busque uma proposta por palavra-chave.",
  },
  {
    icon: PenLine,
    title: "Escreva e envie na plataforma",
    body: "Produza sua redação com um ambiente que mantém o tema e os textos motivadores disponíveis durante a escrita. Quando terminar, envie para correção.",
  },
  {
    icon: ClipboardCheck,
    title: "Receba uma correção humana",
    body: "Um professor lê sua redação por inteiro e avalia o texto de acordo com as cinco competências do Enem. Você recebe a nota total, o desempenho em cada competência, comentários específicos e uma avaliação geral.",
  },
  {
    icon: Target,
    title: "Saiba o que melhorar primeiro",
    body: "A correção destaca o principal gargalo da redação e organiza de uma a cinco prioridades concretas para orientar seu próximo estudo.",
  },
  {
    icon: RefreshCcw,
    title: "Pratique com o próprio texto",
    body: "A partir dos problemas encontrados, o professor propõe uma tarefa de reescrita. Você pode ser orientado a reformular uma tese, reconstruir um parágrafo, aprofundar um argumento ou revisar a proposta de intervenção.",
  },
  {
    icon: LineChart,
    title: "Acompanhe seu desempenho",
    body: "Consulte sua última nota, sua média geral e por competência, a evolução das notas ao longo das redações e o histórico completo de textos e correções.",
  },
];

export function ComoFuncionaContent() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="float-blob pointer-events-none absolute -right-32 -top-28 -z-10 h-80 w-80 rounded-full bg-pastel-blue blur-3xl"
        />
        <Container className="py-16 sm:py-20">
          <h1 className="max-w-3xl font-display text-4xl font-extrabold text-foreground sm:text-6xl">
            Da escolha do tema ao caminho dos seus estudos.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Em seis etapas, veja o que você faz, o que o professor entrega e
            como a correção orienta sua prática.
          </p>
          <div className="mt-8">
            <CTAButton href="/cadastro" dataCta="signup-como-funciona">
              Corrigir minha redação grátis
            </CTAButton>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-8 pb-20 sm:py-12 sm:pb-24">
          <ScrollTimeline steps={steps} />
        </Container>
      </section>

      <section className="bg-secondary">
        <Container className="py-20">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
                Pronto para começar pela primeira correção?
              </h2>
              <p className="mt-4 text-muted-foreground">
                1 crédito grátis, sem cartão de crédito.
              </p>
              <div className="mt-8 flex justify-center">
                <CTAButton
                  href="/cadastro"
                  dataCta="signup-como-funciona-final"
                >
                  Fazer minha correção gratuita
                </CTAButton>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
