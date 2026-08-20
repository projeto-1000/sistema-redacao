import type { Metadata } from "next";
import { Container } from "@/components/site/Container";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de privacidade do Projeto 1000.",
  robots: { index: false },
};

export default function PrivacidadePage() {
  return (
    <Container className="py-24">
      <h1 className="font-display text-4xl font-bold text-foreground">
        Política de Privacidade
      </h1>
      <p className="mt-4 text-muted-foreground">Conteúdo em elaboração.</p>
    </Container>
  );
}
