'use client'

import { deleteEssayTopicAction, getTopicDetails } from "@/app/actions/topics"
import { EssayTopic } from "@repo/types"
import { Button } from "@repo/ui/components/button"
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from "@repo/ui/components/menubar"
import { ThemeBadge } from "@repo/ui/components/theme-badge"
import { formatDate } from "@repo/utils"
import { Calendar, CheckCircle2, EllipsisVertical, OctagonAlert } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog"
import { TopicDetailsDialog } from "@repo/ui/components/topic-details-dialog"

interface TopicCardProps {
  topic: EssayTopic
}

export default function TopicCard({ topic }: TopicCardProps) {
  const [isDeleting, startTransition] = useTransition();

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteEssayTopicAction(id);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error("Erro ao excluir essa tema", { description: "Tente novamente mais tarde." });
      } finally {
        toast.success("Tema removido", {
          description: "O tema e todos os arquivos associados foram excluídos."
        });
      }
    });
  };

  return (
    <div
      key={topic.id}
      className="flex flex-col p-6 rounded-3xl border border-border bg-white shadow-sm min-h-fit justify-between gap-3"
    >
      <ThemeBadge
        value={topic.axis}
        className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest mb-12rounded-sm w-fit"
      />

      <h2 className="text-lg font-black leading-snug">
        {topic.title}
      </h2>

      <p className="text-slate-500 text-xs tracking-wider">
        {topic.source_type} | {topic.source_year}
      </p>

      <div className="flex items-center justify-between text-sm font-bold mt-2">
        <span className="flex items-center font-medium gap-1.5 text-slate-500">
          <Calendar className="size-3.5" />
          Cadastrado em {formatDate(topic.created_at, 'numeric')}
        </span>

        {topic.active === true ? (
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="size-3.5" />
            Ativo
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-500">
            <OctagonAlert className="size-3.5" />
            Inativo
          </span>
        )}
      </div>

      <div className="flex items-center w-full gap-2 mt-4">

        <TopicDetailsDialog
          topic={topic}
          getTopicDetailsAction={getTopicDetails}
          className="flex-1 rounded-xl text-slate-500 font-bold h-10"
          showStartButton={false} />

        <Menubar className="shrink-0 w-fit border-none bg-transparent shadow-none p-0 m-0">
          <MenubarMenu>
            <MenubarTrigger asChild className="bg-transparent p-0 m-0 cursor-pointer">
              <Button variant='ghost' size="icon" className="h-10 w-10">
                <EllipsisVertical className="size-5" />
              </Button>
            </MenubarTrigger>

            <MenubarContent>
              <MenubarItem>
                Editar tema
              </MenubarItem>
              <MenubarItem>
                Desativar
              </MenubarItem>
              <MenubarSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <MenubarItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Excluir tema
                  </MenubarItem>
                </AlertDialogTrigger>

                <AlertDialogContent className="rounded-3xl border-none">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-black">
                      Você tem certeza absoluta?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-500 font-medium">
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o tema
                      <strong> &quot;{topic.title}&quot;</strong> e removerá todos os textos e imagens do nosso banco de dados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-xl font-bold border-none bg-slate-100 text-slate-600 hover:bg-slate-200">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(topic.id)}
                      disabled={isDeleting}
                      className="rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-sm"
                    >
                      {isDeleting ? "Excluindo..." : "Sim, excluir tudo"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </div >
  )
}