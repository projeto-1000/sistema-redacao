import { CircleAlert, ChevronDown, PackageOpen } from "lucide-react";
import { listExtraCreditPackages } from "@/app/actions/extra-credit-packages";
import type { ExtraCreditPackage } from "@repo/types";
import ExtraCreditPackagesRow from "./extra-credit-packages-row";

interface ExtraCreditPackageListProps {
  packages: ExtraCreditPackage[];
  emptyMessage: string;
}

function ExtraCreditPackageList({
  packages,
  emptyMessage,
}: ExtraCreditPackageListProps) {
  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-3 rounded-full bg-slate-50 p-3">
          <PackageOpen
            className="size-7 text-slate-400"
            strokeWidth={1.5}
          />
        </div>

        <p className="text-sm font-medium text-slate-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/50 px-8 py-5 lg:grid">
        <div className="col-span-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Pacote
        </div>

        <div className="col-span-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Créditos
        </div>

        <div className="col-span-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Status
        </div>

        <div className="col-span-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Valor
        </div>

        <div className="col-span-2 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Ação
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {packages.map((packageItem) => (
          <ExtraCreditPackagesRow
            key={packageItem.id}
            packageItem={packageItem}
          />
        ))}
      </div>
    </>
  );
}

export async function ExtraCreditPackagesTable() {
  const { packages, error } = await listExtraCreditPackages();

  if (error) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-100 px-6 py-24 text-center duration-500">
        <CircleAlert className="mb-4 size-14 rounded-full bg-white p-1 text-red-500 shadow-sm" />

        <h3 className="mb-1 text-lg font-bold text-red-600">
          Ocorreu um erro.
        </h3>

        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
          Não conseguimos carregar os pacotes de créditos extras.
          Recarregue a página ou tente novamente em instantes.
        </p>
      </div>
    );
  }

  const activePackages =
    packages?.filter((packageItem) => packageItem.is_active) ?? [];

  const inactivePackages =
    packages?.filter((packageItem) => !packageItem.is_active) ?? [];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <h2 className="text-base font-black text-slate-800">
            Pacotes ativos
          </h2>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Disponíveis para compra pelos alunos elegíveis.
          </p>
        </div>

        <ExtraCreditPackageList
          packages={activePackages}
          emptyMessage="Nenhum pacote ativo no momento."
        />
      </section>

      <details className="group overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 sm:px-8 [&::-webkit-details-marker]:hidden">
          <div>
            <h2 className="text-base font-black text-slate-800">
              Pacotes inativos
            </h2>

            <p className="mt-1 text-xs font-medium text-slate-500">
              {inactivePackages.length}{" "}
              {inactivePackages.length === 1
                ? "pacote preservado"
                : "pacotes preservados"}
            </p>
          </div>

          <ChevronDown className="size-5 text-slate-400 transition-transform group-open:rotate-180" />
        </summary>

        <div className="border-t border-slate-100">
          <ExtraCreditPackageList
            packages={inactivePackages}
            emptyMessage="Nenhum pacote inativo."
          />
        </div>
      </details>
    </div>
  );
}