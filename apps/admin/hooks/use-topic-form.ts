import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTopicSchema, type CreateTopicSchema } from "@repo/validators";
import { createEssayTopic, updateEssayTopic } from "@/app/actions/topics";
import { toast } from "sonner";
import type { EssayTopicDetail } from "@repo/types";

export function useTopicForm(initialData?: EssayTopicDetail) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateTopicSchema>({
    resolver: zodResolver(createTopicSchema),
    mode: "onChange",
    defaultValues: initialData
      ? {
          title: initialData.title,
          axis: initialData.axis as CreateTopicSchema["axis"],
          sourceType: initialData.source_type as CreateTopicSchema["sourceType"],
          sourceYear: initialData.source_year || "",
          motivationalTexts:
            initialData.motivational_texts && initialData.motivational_texts.length > 0
              ? initialData.motivational_texts.map((text) => ({
                  sourceReference: text.source_reference || "",
                  bodyText: text.body_text || "",
                  imageUrl: text.image_url || undefined,
                }))
              : [{ sourceReference: "", bodyText: "", imageUrl: undefined }],
        }
      : {
          title: "",
          sourceType: "ENEM",
          sourceYear: "",
          motivationalTexts: [{ sourceReference: "", bodyText: "", imageUrl: undefined }],
        },
  });

  const handleSubmit = async (data: CreateTopicSchema) => {
    startTransition(async () => {
      try {
        const formData = new FormData();

        const cleanMotivationalTexts = data.motivationalTexts.map((text, index) => {
          if (text.imageUrl instanceof File) {
            formData.append(`file_${index}`, text.imageUrl);
            return { ...text, imageUrl: "FILE_ATTACHED" };
          }
          return text;
        });

        const jsonPayload = { ...data, motivationalTexts: cleanMotivationalTexts };

        if (jsonPayload.sourceType === "AUTORAL" || jsonPayload.sourceYear === "") {
          jsonPayload.sourceYear = undefined;
        }

        formData.append("jsonData", JSON.stringify(jsonPayload));

        let result;

        if (initialData?.id) {
          formData.append("topicId", initialData.id);
          result = await updateEssayTopic(formData);
        } else {
          result = await createEssayTopic(formData);
        }

        if (result?.error) {
          console.error(result.error);
          toast.error(initialData ? "Erro ao atualizar tema" : "Erro ao salvar tema");
        } else {
          router.push("/temas");
          toast.success(initialData ? "Tema atualizado com sucesso!" : "Tema salvo!");
        }
      } catch (err) {
        toast.error("Erro crítico", {
          description: "Ocorreu um erro inesperado ao conectar com o servidor.",
        });
        console.error("Erro no salvamento:", err);
      }
    });
  };

  return {
    form,
    isPending,
    onSubmit: form.handleSubmit(handleSubmit),
    isValid: form.formState.isValid,
  };
}
