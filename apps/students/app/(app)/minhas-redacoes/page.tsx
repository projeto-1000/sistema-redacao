import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { getUserEssays } from "@/services/get-essays";
import { EssayList } from "@/components/essay-list";

export default async function MyEssaysPage() {

  const essays = await getUserEssays();

  return (
    <div className="min-h-screen px-4 md:px-10 lg:px-12 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">
            Minhas Redações
          </h2>
          <p className="text-[#8B8265]">
            Acompanhe seu progresso e evolução na escrita.
          </p>
        </div>

        <Link href="/temas">
          <Button className="rounded-full h-14 gap-2 w-full sm:w-auto px-6 shadow-lg shadow-yellow-400/20 bg-yellow-400 hover:bg-yellow-500 font-bold">
            <Plus className="size-5" />
            Enviar nova redação
          </Button>
        </Link>
      </div>

      <EssayList initialEssays={essays} />

      {/* TODO: Paginação (Pode ficar aqui ou dentro da lista, dependendo da estratégia) */}
      <div className="flex justify-center items-center gap-2 mt-8">
        <button className="size-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-50">
          <ChevronLeft className="size-5" />
        </button>
        <button className="size-10 flex items-center justify-center rounded-full bg-[#EBC84C] font-bold">
          1
        </button>
        <button className="size-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-colors">
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}