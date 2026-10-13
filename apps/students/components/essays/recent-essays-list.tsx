import { FilePenLine, FileText } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { EssayCard } from "./essay-card";
import { getStudentEssays } from "@/app/actions/get-essays";

export async function RecentEssaysList() {
  const { essays } = await getStudentEssays({ limit: 3 });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-foreground flex items-center gap-2 text-lg font-bold">
          <FileText className="text-secondary size-10 rounded-xl bg-blue-100/50 p-2" />
          Redações Recentes
        </h3>
        {essays.length > 0 && (
          <Link href="/minhas-redacoes">
            <p className="text-secondary text-end text-sm font-bold hover:underline">
              Ver todas as redações
            </p>
          </Link>
        )}
      </div>

      {essays.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {essays.map((essay) => (
            <EssayCard key={essay.id} essay={essay} />
          ))}
        </div>
      ) : (
        <div className="border-border flex min-h-[250px] flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-white/50 p-12 text-center">
          <FilePenLine className="mb-4 size-10 rounded-full bg-amber-100 p-2.5" />
          <h4 className="mb-2 font-bold">
            Você ainda não enviou nenhuma redação. Que tal começar agora?
          </h4>
          <p className="text-muted-foreground mb-6 max-w-md text-sm">
            Escolha um tema e pratique sua escrita. Nossos corretores estão prontos para te ajudar.
          </p>
          <Button asChild className="shadow-primary/20 rounded-2xl px-8 py-6 font-bold shadow-lg">
            <Link href="/temas">Ver Temas Disponíveis</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
