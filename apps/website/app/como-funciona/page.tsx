import type { Metadata } from "next";
import { ComoFuncionaContent } from "@/components/site/ComoFuncionaContent";

export const metadata: Metadata = {
  title: "Como funciona",
  description:
    "Da escolha do tema ao caminho dos seus estudos, em seis etapas.",
};

export default function ComoFuncionaPage() {
  return <ComoFuncionaContent />;
}
