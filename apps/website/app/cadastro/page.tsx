import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  UserPlus,
  Upload,
  ClipboardCheck,
  BarChart3,
  PenLine,
  MessageCircle,
  GraduationCap,
  Target,
  ListChecks,
} from "lucide-react";
import { Container } from "@/components/site/Container";
import { Reveal } from "@/components/site/Reveal";
import { SignupForm } from "@/components/site/SignupForm";
const fernando = "/images/fernando.jpg";

const title = "Corrigir minha redação grátis | Projeto 1000";
const description =
  "Crie sua conta e receba 1 crédito para uma correção completa: nota nas cinco competências do Enem, principal ponto de melhoria, próximos passos e tarefa de reescrita.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
};

const passos = [
  {
    icon: UserPlus,
    n: "01",
    title: "Crie sua conta gratuita",
    body: "Conclua o cadastro e receba 1 crédito para enviar sua primeira redação.",
  },
  {
    icon: Upload,
    n: "02",
    title: "Envie sua redação",
    body: "Escolha uma proposta do catálogo ou envie um texto que você já escreveu, digitado.",
  },
  {
    icon: ClipboardCheck,
    n: "03",
    title: "Receba sua correção",
    body: "Um professor avalia as cinco competências, identifica seu principal ponto de melhoria e indica os próximos passos e uma tarefa de reescrita.",
  },
];

const beneficios = [
  {
    icon: GraduationCap,
    title: "Avaliação nas cinco competências",
    body: "Nota e comentário específico em cada competência do Enem, além de uma avaliação geral da redação.",
  },
  {
    icon: MessageCircle,
    title: "Comentários sobre o seu texto",
    body: "O professor indica problemas e acertos da redação para que você compreenda como a avaliação foi construída, com comentários gerais e divididos por competência.",
  },
  {
    icon: Target,
    title: "Principal gargalo",
    body: "A correção identifica o ponto que mais limita seu texto naquele momento. É por ele que você começa.",
  },
  {
    icon: ListChecks,
    title: "Próximos passos",
    body: "Você recebe orientações práticas sobre o que deve priorizar antes de produzir uma nova redação.",
  },
  {
    icon: PenLine,
    title: "Tarefa de reescrita",
    body: "Um trecho do próprio texto se transforma em exercício para você começar a corrigir o problema identificado.",
  },
  {
    icon: BarChart3,
    title: "Histórico de evolução",
    body: "Acompanhe suas notas gerais, o desempenho em cada competência e todas as redações enviadas em um único painel.",
  },
];

const faq = [
  {
    q: "É grátis mesmo?",
    a: "Sim. Ao criar sua conta, você recebe 1 crédito para enviar uma redação e receber a correção completa. Não é necessário informar cartão de crédito nem assinar um plano. Depois, você decide se deseja continuar.",
  },
  {
    q: "Em quanto tempo recebo a correção?",
    a: "O prazo de entrega é de 48h úteis. Quando a correção fica pronta, avisamos pelo WhatsApp.",
  },
  {
    q: "Posso enviar uma redação que já escrevi?",
    a: "Sim. Você pode escolher uma proposta do nosso catálogo ou enviar uma redação que já tenha escrito. O texto será digitado na nossa plataforma, para análise dos nossos professores.",
  },
  {
    q: "A nota é a mesma que eu receberia no Enem?",
    a: "A correção segue os critérios das cinco competências do Enem, mas não é possível garantir que a nota seja exatamente a mesma atribuída por avaliadores oficiais.",
  },
  {
    q: "Preciso assinar algum plano depois?",
    a: "Não. Depois da correção gratuita, você decide se quer continuar com um dos nossos planos para evoluir seu histórico. A matrícula é feita por você, no seu tempo.",
  },
];

export default function CadastroPage() {
  return (
    <>
      {/* HERO + FORM */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="float-blob absolute -left-32 -top-24 h-72 w-72 rounded-full bg-pastel-blue blur-3xl" />
          <div
            className="float-blob absolute -right-24 top-40 h-72 w-72 rounded-full bg-pastel-yellow blur-3xl"
            style={{ animationDelay: "-4s" }}
          />
        </div>

        <Container className="relative grid gap-10 py-12 md:grid-cols-[1.05fr_0.95fr] md:py-20">
          {/* Form primeiro no mobile */}
          <div className="order-1 md:order-2">
            <Reveal>
              <div id="signup" className="scroll-mt-28">
                <SignupForm />
              </div>
            </Reveal>
          </div>

          <div className="order-2 md:order-1">
            <Reveal>
              <span className="pill bg-pastel-blue text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Sua primeira redação é por nossa conta
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Envie sua redação do Enem e descubra o que precisa mudar no{" "}
                <span className="text-primary">seu próprio texto</span>
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Você recebe uma correção completa, feita por professor: nota nas
                cinco competências, comentários sobre sua redação, identificação
                do principal ponto de melhoria, principais pontos a trabalhar e
                uma tarefa de reescrita.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <ul className="mt-7 grid gap-3">
                {[
                  "Correção individual feita por professor",
                  "Avaliação nas cinco competências do Enem",
                  "Principal ponto de melhoria e próximos passos",
                  "Tarefa de reescrita para começar a mudança",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-3 text-sm text-foreground/85"
                  >
                    <span className="icon-bubble h-6 w-6 shrink-0 bg-pastel-blue">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <span className="min-w-0">{t}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={260}>
              <span className="pill mt-7 bg-pastel-yellow font-bold text-accent-foreground">
                1 crédito grátis. Sem cartão de crédito.
              </span>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 3 PASSOS */}
      <section className="border-y border-border bg-secondary">
        <Container className="py-16 md:py-20">
          <Reveal>
            <h2 className="max-w-2xl font-display text-2xl font-extrabold text-foreground sm:text-4xl">
              Do cadastro à correção em três passos.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {passos.map((p, i) => (
              <Reveal key={p.n} delay={i * 100}>
                <div className="card-soft h-full p-7">
                  <span className="icon-bubble bg-pastel-blue">
                    <p.icon className="h-5 w-5 text-primary" />
                  </span>
                  <p className="mt-5 font-display text-4xl font-extrabold text-primary/20">
                    {p.n}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-bold uppercase text-foreground">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <div className="mt-10">
              <a
                href="#signup"
                data-cta="signup-passos"
                className="press-fx arrow-slide inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-bold uppercase text-primary-foreground"
              >
                Criar minha conta gratuita <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* O QUE VOCÊ RECEBE */}
      <section>
        <Container className="py-16 md:py-20">
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-4xl">
                Mais que uma nota
              </h2>
              <p className="mt-4 text-muted-foreground">
                Uma correção feita por professores para mostrar o que aconteceu
                no seu texto e onde concentrar seu esforço.
              </p>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {beneficios.map((d, i) => (
              <Reveal key={d.title} delay={(i % 3) * 90}>
                <div className="card-soft h-full p-7">
                  <span className="icon-bubble bg-pastel-yellow">
                    <d.icon className="h-5 w-5 text-accent-foreground" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold uppercase text-foreground">
                    {d.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {d.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* QUEM ESTÁ POR TRÁS */}
      <section>
        <Container className="pb-16 md:pb-20">
          <Reveal>
            <div className="on-navy grid items-start gap-8 rounded-4xl p-8 shadow-(--shadow-card) sm:p-12 md:grid-cols-[1fr_0.6fr]">
              <div>
                <span className="pill bg-accent/15 text-accent">
                  Quem está por trás
                </span>
                <h2 className="mt-5 font-display text-2xl font-extrabold sm:text-4xl">
                  O Projeto 1000 nasceu de 14 anos ensinando redação
                </h2>
                <div className="mt-5 space-y-4 text-sm leading-relaxed text-foreground/80 sm:text-base">
                  <p>
                    Sou o Fernando Entratice, professor de redação e criador do
                    Projeto 1000. Há 14 anos ensino redação para o Enem. Também
                    construí parte importante da minha carreira ensinando
                    Português e Redação para o concurso de diplomacia, trabalho
                    no qual ajudei a preparar mais de 50 diplomatas.
                  </p>
                  <p>
                    Essa experiência me levou a estudar não apenas o texto
                    pronto, mas o processo que existe antes dele: como uma ideia
                    nasce, transforma-se em argumento e passa a cumprir uma
                    função dentro da redação.
                  </p>
                  <p>
                    Foi desse trabalho que nasceu o Sistema de Escrita Guiada,
                    que deu origem à lógica pedagógica do Projeto 1000.
                  </p>
                </div>

                <h3 className="mt-8 font-display text-lg font-extrabold uppercase text-accent sm:text-xl">
                  Um método criado por mim. Uma correção realizada por
                  professores.
                </h3>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground/80 sm:text-base">
                  <p>
                    Nem todas as redações são corrigidas pessoalmente por mim.
                    Elas são avaliadas por professores especializados em redação
                    do Enem e treinados no sistema de correção da plataforma.
                  </p>
                  <p>
                    Assim, cada texto recebe uma leitura humana e individual,
                    com critérios comuns e uma prioridade clara para o próximo
                    passo.
                  </p>
                </div>

                <a
                  href="#signup"
                  data-cta="signup-autoridade"
                  className="press-fx arrow-slide mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-bold uppercase text-accent-foreground"
                >
                  Criar minha conta e receber 1 crédito{" "}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <Image
                src={fernando}
                alt="Fernando Entratice, professor de redação e criador do Projeto 1000"
                width={260}
                height={325}
                className="mx-auto aspect-4/5-full max-w-[260px] rounded-3xl object-cover shadow-2xl"
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ANTES DE SE CADASTRAR */}
      <section className="border-t border-border bg-secondary">
        <Container className="py-16 md:py-20">
          <Reveal>
            <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-4xl">
              Antes de se cadastrar
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4">
            {faq.map((item, i) => (
              <Reveal key={item.q} delay={i * 80}>
                <details className="card-soft group p-6">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-base font-bold text-foreground">
                    {item.q}
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA FINAL */}
      <section>
        <Container className="py-16 md:py-20">
          <Reveal>
            <div className="on-navy rounded-4xl p-8 text-center shadow-(--shadow-card) sm:p-12">
              <h2 className="font-display text-2xl font-extrabold uppercase sm:text-4xl">
                Saiba por onde começar. Receba sua correção com caminho.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-foreground/80 sm:text-base">
                Crie sua conta, envie seu texto e receba uma correção completa.
                Um professor avalia sua redação, identifica o principal ponto de
                melhoria, mostra o que deve ser priorizado no próximo texto e
                traz uma tarefa de reescrita do texto enviado.
              </p>
              <a
                href="#signup"
                data-cta="signup-final-cadastro"
                className="press-fx arrow-slide mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-4 text-sm font-bold uppercase text-accent-foreground"
              >
                Criar minha conta e receber 1 crédito{" "}
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-6 text-xs text-foreground/70">
                1 crédito grátis. Sem cartão de crédito.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
