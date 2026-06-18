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
    <div className="min-h-dvh px-4 md:px-10 lg:px-12 py-4 space-y-8">
      <PageHeader
        title="Editar Tema"
        subtitle="Atualize os detalhes da proposta de redação e os textos de apoio."
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-8">

          <TopicInfoForm />

          <div className="flex items-center justify-between mt-12 mb-4 px-2">
            <h2 className="text-xl font-black flex items-center gap-3">
              <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <FileText className="size-4" />
              </div>
              Textos Motivadores
            </h2>
            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase px-3 py-1.5 rounded-full tracking-wider">
              Mínimo 1 obrigatório
            </span>
          </div>

          <MotivationalTextList />

          <div className="flex items-center justify-end gap-3 pt-8 mt-8 border-t border-slate-200">
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100"
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