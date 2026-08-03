import { z } from "zod";

const correctionScoreSchema = z
  .number()
  .int("A nota deve ser um número inteiro.")
  .min(0, "A nota mínima é 0.")
  .max(200, "A nota máxima é 200.")
  .refine(
    (score) => score % 40 === 0,
    "A nota deve seguir os intervalos de 40 pontos."
  );

const correctionCommentSchema = z
  .string()
  .trim()
  .max(2000, "O comentário deve ter no máximo 2.000 caracteres.");

const requiredListItemSchema = z
  .string()
  .trim()
  .min(1, "Preencha todos os itens da lista.")
  .max(250, "Cada item deve ter no máximo 250 caracteres.");

const correctionHighlightSchema = z
  .object({
    id: z.string().min(1, "O destaque precisa ter um identificador."),

    text: z
      .string()
      .min(1, "O texto destacado não pode estar vazio."),

    compId: z
      .string()
      .min(1, "O destaque precisa estar associado a uma competência."),

    startIndex: z
      .number()
      .int()
      .min(0, "A posição inicial do destaque é inválida."),

    endIndex: z
      .number()
      .int()
      .min(0, "A posição final do destaque é inválida."),
  })
  .refine(
    (highlight) =>
      highlight.endIndex >= highlight.startIndex,
    {
      path: ["endIndex"],
      message:
        "A posição final do destaque deve ser maior ou igual à inicial.",
    }
  );

export const finalCorrectionSchema = z.object({
  scores: z.object({
    c1: correctionScoreSchema,
    c2: correctionScoreSchema,
    c3: correctionScoreSchema,
    c4: correctionScoreSchema,
    c5: correctionScoreSchema,
  }),

  comments: z.object({
    c1: correctionCommentSchema,
    c2: correctionCommentSchema,
    c3: correctionCommentSchema,
    c4: correctionCommentSchema,
    c5: correctionCommentSchema,
  }),

  general_comment: z
    .string()
    .trim()
    .min(1, "O comentário geral é obrigatório.")
    .max(
      3000,
      "O comentário geral deve ter no máximo 3.000 caracteres."
    ),

  main_bottleneck: z
    .string()
    .trim()
    .min(1, "O principal gargalo é obrigatório.")
    .max(
      500,
      "O principal gargalo deve ter no máximo 500 caracteres."
    ),

next_essay_priorities: z
  .array(requiredListItemSchema)
  .min(1, "Informe pelo menos uma prioridade para a próxima redação.")
  .max(3, "Informe no máximo três prioridades para a próxima redação."),

  rewrite_tasks: z
    .array(requiredListItemSchema)
    .min(
      1,
      "Informe pelo menos uma tarefa de reescrita."
    )
    .max(
      3,
      "Informe no máximo três tarefas de reescrita."
    ),

  highlights: z.array(correctionHighlightSchema),
});

export type FinalCorrectionInput = z.input<
  typeof finalCorrectionSchema
>;

export type FinalCorrectionValues = z.infer<
  typeof finalCorrectionSchema
>;