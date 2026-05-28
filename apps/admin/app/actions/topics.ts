"use server";

import { createClient } from "@/lib/server";
import { EssayTopic, TopicsFilter } from "@repo/types";
import { PostgrestError } from "@supabase/supabase-js";
import { createTopicSchema } from "@repo/validators";
import { revalidatePath } from "next/cache";

interface GetTopicsParams {
  filters?: TopicsFilter;
  page?: number;
}

export async function getTopicsList({ filters, page = 1 }: GetTopicsParams = {}): Promise<{
  topics: EssayTopic[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const limit = 10;
  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  let query = supabase
    .from("essay_topics")
    .select("id, title, axis, active, source_type, source_year, created_at", { count: "exact" });

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,axis_text.ilike.%${filters.search}%`);
  }

  if (filters?.axis && filters.axis !== "Todos") {
    query = query.eq("axis", filters.axis);
  }

  const { data, count, error } = await query
    .range(rangeStart, rangeEnd)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar lista de temas:", error);
    return { topics: [], totalPages: 0, error };
  }

  return {
    topics: data,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: null,
  };
}

export async function createEssayTopicAction(formData: FormData) {
  const supabase = await createClient();

  const rawData = formData.get("jsonData") as string;
  const parsedData = createTopicSchema.safeParse(JSON.parse(rawData));

  if (!parsedData.success) {
    console.error("Erros do Zod:", parsedData.error.flatten().fieldErrors);
    return { error: "Dados inválidos. Verifique os campos obrigatórios." };
  }

  const data = parsedData.data;
  const effectiveYear = data.sourceType === "AUTORAL" ? new Date().getFullYear() : data.sourceYear;
  const formattedSource = data.sourceType.toLowerCase().replace(/\s+/g, "-");

  const uploadedImagePaths: string[] = [];

  try {
    for (let i = 0; i < data.motivationalTexts.length; i++) {
      const file = formData.get(`file_${i}`) as File | null;

      if (file) {
        const fileExt = file.name.split(".").pop();

        const fileName = `${formattedSource}-${effectiveYear}-motivador-${i + 1}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("themes")
          .upload(fileName, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          throw new Error(`Falha no upload da imagem do texto ${i + 1}.`);
        }

        uploadedImagePaths.push(fileName);

        const { data: publicUrlData } = supabase.storage.from("themes").getPublicUrl(fileName);

        const currentText = data.motivationalTexts[i];
        if (currentText) {
          currentText.imageUrl = publicUrlData.publicUrl;
        }
      }
    }

    const { data: topic, error: topicError } = await supabase
      .from("essay_topics")
      .insert({
        title: data.title,
        axis: data.axis,
        source_type: data.sourceType,
        source_year: effectiveYear,
        active: true,
      })
      .select("id")
      .single();

    if (topicError || !topic) {
      throw new Error("Erro ao criar a estrutura do tema no banco.");
    }

    const textsToInsert = data.motivationalTexts.map((text) => ({
      topic_id: topic.id,
      body_text: text.bodyText || null,
      image_url: text.imageUrl || null,
      source_reference: text.sourceReference,
    }));

    const { error: textsError } = await supabase.from("motivational_texts").insert(textsToInsert);

    if (textsError) {
      await supabase.from("essay_topics").delete().eq("id", topic.id);
      throw new Error("Erro ao vincular os textos motivadores ao tema.");
    }

    return { success: true, topicId: topic.id };
  } catch (error: unknown) {
    console.error("Transação falhou. Iniciando Rollback de segurança...", error);

    if (uploadedImagePaths.length > 0) {
      await supabase.storage.from("themes").remove(uploadedImagePaths);
    }

    const errorMessage =
      error instanceof Error ? error.message : "Ocorreu um erro crítico ao salvar o tema.";

    return { error: errorMessage };
  }
}

export async function deleteEssayTopicAction(topicId: string) {
  const supabase = await createClient();

  try {
    const { data: texts, error: fetchError } = await supabase
      .from("motivational_texts")
      .select("image_url")
      .eq("topic_id", topicId)
      .not("image_url", "is", null);

    if (fetchError) throw new Error("Falha ao mapear arquivos para exclusão.");

    const { error: dbError } = await supabase.from("essay_topics").delete().eq("id", topicId);

    if (dbError) throw dbError;

    if (texts && texts.length > 0) {
      const filePaths = texts.map((t) => t.image_url).filter((path): path is string => !!path);

      const { error: storageError } = await supabase.storage.from("themes").remove(filePaths);

      if (storageError) {
        console.error("Aviso: Registro deletado, mas falha ao limpar Storage:", storageError);
      }
    }

    revalidatePath("/temas");
    return { success: true };
  } catch (error: any) {
    console.error("Erro na exclusão total:", error);
    return { error: error.message || "Falha ao excluir o tema." };
  }
}
