
import { Button } from "@repo/ui/components/button";
import { Headphones, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function PlanHelpCallout() {
  return (
    <div className="w-full bg-[#F4F7FC] border border-blue-100/50 rounded-3xl p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between mt-8">

      {/* Lado Esquerdo: Textos e Botões */}
      <div className="max-w-2xl flex flex-col items-start text-left">
        <h3 className="text-2xl font-extrabold text-slate-800 mb-4">
          Precisa de algo diferente?
        </h3>
        <p className="text-base font-medium text-slate-600 leading-relaxed mb-8">
          Se você precisa de um plano personalizado para sua escola ou cursinho, ou deseja comprar créditos avulsos para revisões extras, entre em contato com nosso suporte.
        </p>

        <div className="flex flex-wrap gap-4">
          <Button asChild className="h-12 rounded-xl font-bold">
            <Link href="/suporte">
              <Headphones className="mr-2 size-4" /> Falar com Suporte
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-12 rounded-xl hover:text-primary hover:bg-primary-5 font-bold hover:text-amber-400 hover:font-extrabold">
            <Link href="/assinaturas/comprar-creditos">
              <ShoppingCart className="mr-2 size-4" /> Comprar Créditos
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-[260px] h-[300px] shrink-0 flex items-center justify-center">
        <Image
          src="/contact-us.svg"
          alt="Ilustração de Contato e Suporte"
          fill
          priority
          className="object-contain"
        />
      </div>

    </div>
  );
}