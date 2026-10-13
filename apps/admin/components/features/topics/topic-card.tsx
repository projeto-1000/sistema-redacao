"use client";

import { deleteEssayTopic, getTopicDetails, toggleTopicStatus } from "@/app/actions/topics";
import { EssayTopic } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
} from "@repo/ui/components/menubar";
import { ThemeBadge } from "@repo/ui/components/theme-badge";
import { formatDate } from "@repo/utils";
import { Calendar, CheckCircle2, EllipsisVertical, OctagonAlert } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
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
} from "@repo/ui/components/alert-dialog";
import { TopicDetailsDialog } from "@repo/ui/components/topic-details-dialog";
import Link from "next/link";

interface TopicCardProps {
  topic: EssayTopic;
}

export default function TopicCard({ topic }: TopicCardProps) {
  const [isDeleting, startTransition] = useTransition();

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteEssayTopic(id);
      } catch {
        toast.error("Erro ao excluir essa tema", { description: "Tente novamente mais tarde." });
      } finally {
        toast.success("Tema removido", {
          description: "O tema e todos os arquivos associados foram excluídos.",
        });
      }
    });
  };

  const handleToggleStatus = () => {
    startTransition(async () => {
      try {
        const result = await toggleTopicStatus(topic.id, topic.active ?? false);

        if (result?.error) {
          toast.error("Erro ao atualizar status", { description: result.error });
        } else {
          toast.success(topic.active ? "Tema desativado" : "Tema ativado", {
            description: "A visibilidade do tema foi atualizada na plataforma.",
          });
        }
      } catch {
        toast.error("Erro de conexão", { description: "Tente novamente mais tarde." });
      }
    });
  };

  return (
    <div
      key={topic.id}
      className="border-border flex min-h-fit flex-col justify-between gap-3 rounded-3xl border bg-white p-6 shadow-sm"
    >
      <ThemeBadge
        value={topic.axis}
        className="mb-12 inline-block w-fit rounded-sm px-2 py-1 text-[10px] font-bold tracking-widest uppercase"
      />

      <h2 className="text-lg leading-snug font-black">{topic.title}</h2>

      <p className="text-xs tracking-wider text-slate-500">
        {topic.source_type} | {topic.source_year}
      </p>

      <div className="mt-2 flex items-center justify-between text-sm font-bold">
        <span className="flex items-center gap-1.5 font-medium text-slate-500">
          <Calendar className="size-3.5" />
          Cadastrado em {formatDate(topic.created_at, "numeric")}
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

      <div className="mt-4 flex w-full items-center gap-2">
        <TopicDetailsDialog
          topic={topic}
          getTopicDetailsAction={getTopicDetails}
          className="h-10 flex-1 rounded-xl font-bold text-slate-500"
          showStartButton={false}
        />

        <Menubar className="m-0 w-fit shrink-0 border-none bg-transparent p-0 shadow-none">
          <MenubarMenu>
            <MenubarTrigger asChild className="m-0 cursor-pointer bg-transparent p-0">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <EllipsisVertical className="size-5" />
              </Button>
            </MenubarTrigger>

            <MenubarContent>
              <MenubarItem asChild className="cursor-pointer">
                <Link href={`/temas/editar/${topic.id}`}>Editar tema</Link>
              </MenubarItem>
              <MenubarItem
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  handleToggleStatus();
                }}
              >
                {topic.active ? "Desativar tema" : "Ativar tema"}
              </MenubarItem>
              <MenubarSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <MenubarItem
                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
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
                    <AlertDialogDescription className="font-medium text-slate-500">
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente o tema
                      <strong> &quot;{topic.title}&quot;</strong> e removerá todos os textos e
                      imagens do nosso banco de dados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-xl border-none bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(topic.id)}
                      disabled={isDeleting}
                      className="rounded-xl bg-red-600 font-bold text-white shadow-sm hover:bg-red-700"
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
    </div>
  );
}
