"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@repo/ui/components/page-header";
import { Button } from "@repo/ui/components/button";
import { Form } from "@repo/ui/components/form";
import { TopicInfoForm } from "@/components/features/topics/topic-info-form";
import { MotivationalTextList } from "@/components/features/topics/motivational-text-list";
import { useTopicForm } from "@/hooks/use-topic-form";
import type { EssayTopicDetail } from "@repo/types";

interface EditTopicClientProps {
  initialData: EssayTopicDetail;
}

export default function EditTopic({ initialData }: EditTopicClientProps) {
  const router = useRouter();

  const { form, isPending, onSubmit, isValid } = useTopicForm(initialData);

  return (
    <div className="min-h-dvh space-y-8 px-4 py-4 md:px-10 lg:px-12">
      <PageHeader
        title="Editar Tema"
        subtitle="Atualize os detalhes da proposta de redação e os textos de apoio."
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-8">
          <TopicInfoForm />

          <div className="mt-12 mb-4 flex items-center justify-between px-2">
            <h2 className="flex items-center gap-3 text-xl font-black">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <FileText className="size-4" />
              </div>
              Textos Motivadores
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Mínimo 1 obrigatório
            </span>
          </div>

          <MotivationalTextList />

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 pt-8">
            <Button
              type="button"
              variant="ghost"
              className="h-12 rounded-xl px-6 font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !isValid}
              className="h-12 rounded-xl font-bold shadow-sm"
              isLoading={isPending}
              loadingText="Salvando alterações..."
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
