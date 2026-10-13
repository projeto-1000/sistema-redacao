import { Button } from "@repo/ui/components/button";
import { Headphones, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function PlanHelpCallout() {
  return (
    <div className="mt-8 flex w-full flex-col items-center justify-between rounded-3xl border border-blue-100/50 bg-[#F4F7FC] p-8 md:p-10 lg:flex-row">
      <div className="flex max-w-2xl flex-col items-start text-left">
        <h3 className="mb-4 text-2xl font-extrabold text-slate-800">Precisa de algo diferente?</h3>
        <p className="mb-8 text-base leading-relaxed font-medium text-slate-600">
          Se você precisa de um plano personalizado para sua escola ou cursinho, ou deseja comprar
          créditos avulsos para revisões extras, entre em contato com nosso suporte.
        </p>

        <div className="flex flex-wrap gap-4">
          <Button asChild className="h-12 rounded-xl font-bold">
            <Link href="/suporte">
              <Headphones className="mr-2 size-4" /> Falar com Suporte
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="hover:text-primary hover:bg-primary/5 h-12 rounded-xl font-bold hover:font-extrabold"
          >
            <Link href="/assinaturas/comprar-creditos">
              <ShoppingCart className="mr-2 size-4" /> Comprar Créditos
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative flex h-75 w-full max-w-87.5 shrink-0 items-center justify-center">
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
