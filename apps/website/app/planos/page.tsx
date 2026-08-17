import type { Metadata } from "next";
import { PlanosContent } from "@/components/site/PlanosContent";

export const metadata: Metadata = {
  title: "Planos",
  description:
    "Comece com uma correção completa gratuita. Para continuar, escolha entre 4 ou 10 créditos mensais, sem fidelidade.",
};

export default function PlanosPage() {
  return <PlanosContent />;
}
