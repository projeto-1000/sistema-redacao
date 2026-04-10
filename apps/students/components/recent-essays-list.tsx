import { FilePenLine, FileText } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { EssayCard } from "./essay-card";
import { getStudentEssays } from "@/services/get-essays";

export async function RecentEssaysList() {
  const { data: essays } = await getStudentEssays({ limit: 3 })

  return (

    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
          <FileText className="size-10 rounded-xl bg-blue-100/50 text-secondary p-2" />
          Redações Recentes
        </h3>
        {essays.length > 0 && (
          <Link href="/minhas-redacoes">
            <p className="text-sm font-bold text-secondary hover:underline">
              Ver todas as redações
            </p>
          </Link>
        )}
      </div>

      {essays.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {essays.map((essay) => (
            <EssayCard key={essay.id} essay={essay} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-border bg-white/50 min-h-[250px] text-center">
          <FilePenLine className="size-10 p-2.5 rounded-full mb-4 bg-amber-100" />
          <h4 className="font-bold mb-2">
            Você ainda não enviou nenhuma redação. Que tal começar agora?
          </h4>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            Escolha um tema e pratique sua escrita. Nossos corretores estão prontos para te ajudar.
          </p>
          <Button
            asChild
            className="py-6 font-bold rounded-2xl px-8 shadow-lg shadow-primary/20">
            <Link href="/temas">
              Ver Temas Disponíveis
            </Link>
          </Button>
        </div>
      )}

    </div >
  );
}