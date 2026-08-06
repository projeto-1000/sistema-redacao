"use server";

import { createClient } from "@/lib/server";
import { EssayTopic, EssayTopicDetail, MotivationalText, TopicsFilter } from "@repo/types";
import { PostgrestError } from "@supabase/supabase-js";
import { createTopicSchema } from "@repo/validators";
import { revalidatePath } from "next/cache";

interface GetTopicsParams {
  filters?: TopicsFilter;
  page?: number;
}

const THEME_PUBLIC_PATH_MARKER = "/storage/v1/object/public/themes/";

function getThemeObjectPath(value: string | null | undefined) {
  if (!value) return null;
  if (!value.startsWith("http://") && !value.startsWith("https://")) return value;

  const markerIndex = value.indexOf(THEME_PUBLIC_PATH_MARKER);
  if (markerIndex === -1) return null;

  const [objectPath] = value.slice(markerIndex + THEME_PUBLIC_PATH_MARKER.length).split("?");
  return objectPath ? decodeURIComponent(objectPath) : null;
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

export async function getTopicDetails(id: string): Promise<EssayTopicDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("essay_topics")
    .select(
      `
      *,
      motivational_texts (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar detalhes do tema:", error);
    return null;
  }
  if (!data) return null;

  if (data.motivational_texts) {
    data.motivational_texts = data.motivational_texts.map((text: MotivationalText) => {
      if (!text.image_url || text.image_url.startsWith("http")) return text;

      const { data: publicUrlData } = supabase.storage.from("themes").getPublicUrl(text.image_url);

      return { ...text, image_url: publicUrlData.publicUrl };
    });

    data.motivational_texts.sort(
      (a: MotivationalText, b: MotivationalText) => a.text_number - b.text_number
    );
  }

  return data as EssayTopicDetail;
}

export async function createEssayTopic(formData: FormData) {
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

        const currentText = data.motivationalTexts[i];
        if (currentText) {
          currentText.imageUrl = fileName;
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

    const textsToInsert = data.motivationalTexts.map((text, index) => ({
      topic_id: topic.id,
      text_number: index + 1,
      body_text: text.bodyText || null,
      image_url: getThemeObjectPath(text.imageUrl),
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

export async function updateEssayTopic(formData: FormData) {
  const supabase = await createClient();

  const topicId = formData.get("topicId") as string;
  const rawData = formData.get("jsonData") as string;

  if (!topicId || !rawData) {
    return { error: "ID do tema ou dados inválidos." };
  }

  const parsedData = createTopicSchema.safeParse(JSON.parse(rawData));

  if (!parsedData.success) {
    console.error("Erros do Zod (Update):", parsedData.error.flatten().fieldErrors);
    return { error: "Dados inválidos. Verifique os campos obrigatórios." };
  }

  const data = parsedData.data;
  const effectiveYear = data.sourceType === "AUTORAL" ? new Date().getFullYear() : data.sourceYear;
  const formattedSource = data.sourceType.toLowerCase().replace(/\s+/g, "-");

  const uploadedImagePaths: string[] = [];
  let orphanedImagePaths: string[] = [];

  try {
    const { data: existingTexts, error: fetchError } = await supabase
      .from("motivational_texts")
      .select("image_url")
      .eq("topic_id", topicId);

    if (fetchError) throw new Error("Erro ao buscar dados antigos do tema.");

    const oldImagePaths =
      existingTexts
        ?.map((text) => getThemeObjectPath(text.image_url))
        .filter((path): path is string => Boolean(path)) || [];

    const keptImagePaths = data.motivationalTexts
      .map((text) =>
        typeof text.imageUrl === "string" && text.imageUrl !== "FILE_ATTACHED"
          ? getThemeObjectPath(text.imageUrl)
          : null
      )
      .filter((path): path is string => Boolean(path));

    orphanedImagePaths = oldImagePaths.filter((oldPath) => !keptImagePaths.includes(oldPath));

    for (let i = 0; i < data.motivationalTexts.length; i++) {
      const text = data.motivationalTexts[i];
      if (!text) continue;
      if (text.imageUrl === "FILE_ATTACHED") {
        const file = formData.get(`file_${i}`) as File | null;

        if (file && file.size > 0) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${formattedSource}-${effectiveYear}-motivador-${i + 1}-${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("themes")
            .upload(fileName, file, { cacheControl: "3600", upsert: false });

          if (uploadError) {
            throw new Error(`Falha no upload da imagem do texto ${i + 1}.`);
          }

          uploadedImagePaths.push(fileName);

          text.imageUrl = fileName;
        } else {
          text.imageUrl = null;
        }
      }
    }

    const { error: topicError } = await supabase
      .from("essay_topics")
      .update({
        title: data.title,
        axis: data.axis,
        source_type: data.sourceType,
        source_year: effectiveYear,
      })
      .eq("id", topicId);

    if (topicError) {
      throw new Error("Erro ao atualizar a estrutura do tema no banco.");
    }

    const { error: deleteError } = await supabase
      .from("motivational_texts")
      .delete()
      .eq("topic_id", topicId);

    if (deleteError) {
      throw new Error("Erro ao limpar os textos motivadores antigos.");
    }

    const textsToInsert = data.motivationalTexts.map((text, index) => ({
      topic_id: topicId,
      text_number: index + 1,
      body_text: text.bodyText || null,
      image_url: getThemeObjectPath(text.imageUrl),
      source_reference: text.sourceReference,
    }));

    if (textsToInsert.length > 0) {
      const { error: textsError } = await supabase.from("motivational_texts").insert(textsToInsert);
      if (textsError) {
        throw new Error("Erro ao vincular os novos textos motivadores.");
      }
    }

    if (orphanedImagePaths.length > 0) {
      const { error: cleanupError } = await supabase.storage
        .from("themes")
        .remove(orphanedImagePaths);

      if (cleanupError) {
        console.error("[WARNING] Falha ao limpar imagens antigas do bucket:", cleanupError);
      }
    }

    revalidatePath("/temas");
    revalidatePath(`/temas/editar/${topicId}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Transação de Update falhou. Iniciando Rollback das imagens novas...", error);

    if (uploadedImagePaths.length > 0) {
      await supabase.storage.from("themes").remove(uploadedImagePaths);
    }

    const errorMessage =
      error instanceof Error ? error.message : "Ocorreu um erro crítico ao atualizar o tema.";

    return { error: errorMessage };
  }
}

export async function toggleTopicStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient();
  const newStatus = !currentStatus;

  try {
    const { error } = await supabase
      .from("essay_topics")
      .update({ active: newStatus })
      .eq("id", id);

    if (error) {
      throw new Error(`Falha ao alterar o status no banco: ${error.message}`);
    }

    revalidatePath("/temas");

    return { success: true, newStatus };
  } catch (error: unknown) {
    console.error("[TOGGLE_TOPIC_STATUS_ERROR]:", error);
    return {
      error:
        error instanceof Error ? error.message : "Ocorreu um erro crítico ao atualizar o status.",
    };
  }
}

export async function deleteEssayTopic(topicId: string) {
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
      const filePaths = texts
        .map((text) => getThemeObjectPath(text.image_url))
        .filter((path): path is string => Boolean(path));

      const { error: storageError } = await supabase.storage.from("themes").remove(filePaths);

      if (storageError) {
        console.error("Aviso: Registro deletado, mas falha ao limpar Storage:", storageError);
      }
    }

    revalidatePath("/temas");
    return { success: true };
  } catch (error: unknown) {
    console.error("Erro na exclusão total:", error);
    return { error: error instanceof Error ? error.message : "Falha ao excluir o tema." };
  }
}
