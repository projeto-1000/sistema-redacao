import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTopicSchema, type CreateTopicSchema } from "@repo/validators";
import { createEssayTopicAction } from "@/app/actions/topics";
import { toast } from "sonner";

export function useTopicForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateTopicSchema>({
    resolver: zodResolver(createTopicSchema),
    mode: "onChange",
    defaultValues: {
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

        const result = await createEssayTopicAction(formData);

        if (result?.error) {
          console.error(result.error);
          toast.error("Erro ao salvar tema");
        } else {
          router.push("/temas");
          toast.success("Tema salvo!");
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
