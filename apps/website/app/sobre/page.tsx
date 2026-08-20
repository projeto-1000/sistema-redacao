import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Um método criado por Fernando Entratice e correção realizada por professores treinados.",
};
import { Container } from "@/components/site/Container";
import { CTAButton } from "@/components/site/CTAButton";
const fernando = "/images/fernando.jpg";

export default function SobrePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="float-blob pointer-events-none absolute -right-32 -top-28 -z-10 h-80 w-80 rounded-full bg-pastel-yellow blur-3xl"
        />
        <Container className="py-16 sm:py-20">
          <h1 className="max-w-3xl font-display text-4xl font-extrabold text-foreground sm:text-6xl">
            Eu ensino redação há 14 anos. O Projeto 1000 nasceu dessa
            experiência.
          </h1>
        </Container>
      </section>

      <section>
        <Container className="grid gap-10 pb-16 md:grid-cols-[240px_1fr]">
          <div className="mx-auto md:mx-0">
            <div className="h-72 w-60 overflow-hidden rounded-[1.75rem] bg-card shadow-[var(--shadow-card)]">
              <Image
                src={fernando}
                alt="Fernando Entratice, professor e criador do Projeto 1000"
                width={240}
                height={288}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div>
            <h2 className="font-display text-3xl font-extrabold text-foreground">
              Fernando Entratice
            </h2>
            <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Professor e criador do Projeto 1000
            </p>
            <div className="mt-5 space-y-4 text-muted-foreground">
              <p>
                Eu dou aula de redação para o Enem há 14 anos. Também construí
                minha carreira no CACD, o concurso que seleciona diplomatas. A
                redação é mais extensa e tecnicamente mais exigente que a do
                Enem. Esse trabalho, que já ajudou a preparar mais de 50
                diplomatas, me obrigou a estudar a escrita por dentro: como uma
                ideia nasce, vira argumento e sustenta um texto.
              </p>
              <p>
                Nesse tempo, na preparação para o Enem, um problema apareceu
                muitas vezes: o aluno recebia uma nota, lia os comentários e
                continuava sem saber o que fazer no texto seguinte.
              </p>
              <p>
                E foi vendo isso que eu criei o{" "}
                <span className="text-foreground">
                  Sistema de Escrita Guiada (SEG)
                </span>
                . O processo foi dividido em cinco camadas (interpretação,
                conteúdo, estrutura, produção e revisão) para que o aluno pare
                de tentar resolver tudo ao mesmo tempo. Depois de cada redação,
                ele precisa entender o que aconteceu e onde concentrar seu
                esforço.
              </p>
              <p>
                Agora, olha só: isso não significou pegar um método do CACD e
                transportar para o ensino médio. São provas diferentes. O que eu
                trouxe foi a compreensão de que escrever bem não depende de
                inspiração nem de repertório decorado. Depende de saber o que
                fazer em cada etapa.
              </p>
              <p>
                Hoje meu método está dentro do formato do Projeto 1000 de ser
                uma correção propositiva para o aluno; e está dentro da{" "}
                <span className="text-foreground">Mentoria Projeto 1000</span>,
                onde eu acompanho o aluno por 9 semanas até que o SEG deixe de
                ser técnica e vire hábito.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-secondary">
        <Container className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
              Um método criado por mim. Uma correção realizada por professores
              treinados.
            </h2>
            <p className="mt-4 text-muted-foreground">
              As redações são lidas por professores especializados em redação do
              Enem e treinados no sistema de correção do Projeto 1000. Assim,
              mantemos critérios comuns sem transformar a devolutiva numa
              resposta automática: cada texto é considerado por inteiro.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {[
              "Formação em Letras",
              "Experiência com o Enem",
              "Treinamento no sistema",
              "Correção humana e individual",
            ].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary shadow-[var(--shadow-soft)]"
              >
                {chip}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-20">
          <div className="on-navy rounded-[2rem] p-8 shadow-[var(--shadow-card)] md:p-12">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
              Conheça o Projeto 1000 na prática e encontre seu caminho de
              estudos
            </h2>
            <p className="mt-4 max-w-3xl text-foreground/75">
              Envie sua primeira redação gratuitamente e receba nossa correção
              completa, sem informar cartão de crédito.
            </p>
            <div className="mt-8">
              <CTAButton
                href="/cadastro"
                variant="accent"
                dataCta="signup-sobre"
              >
                Fazer minha primeira correção
              </CTAButton>
            </div>
            <p className="mt-4 text-xs text-foreground/70">
              1 crédito grátis. Sem cartão de crédito
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
