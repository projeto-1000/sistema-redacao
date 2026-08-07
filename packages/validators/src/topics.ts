import { z } from "zod";

export const THEMATIC_AXES = [
  "Meio Ambiente",
  "Questões Sociais",
  "Saúde",
  "Cultura",
  "Direitos e Cidadania",
  "Educação",
  "Tecnologia",
  "Economia"
] as const;

export type ThematicAxisType = typeof THEMATIC_AXES[number];

const motivationalTextSchema = z.object({
  bodyText: z.string().optional(),
  imageUrl: z.any().optional(), 
  sourceReference: z.string().min(1, "A fonte do texto é obrigatória"),
}).refine((data) => data.bodyText || data.imageUrl, {
  message: "O texto motivador precisa ter conteúdo escrito ou uma imagem.",
  path: ["bodyText"],
});

export const createTopicSchema = z.object({
  title: z.string().min(5, "O título precisa ter pelo menos 5 caracteres"),
  axis: z.enum(THEMATIC_AXES, {
    errorMap: () => ({ message: "Selecione um eixo temático válido" })
  }),
  sourceType: z.enum([
    "ENEM",
    "ENEM PPL/Reaplicação",
    "AUTORAL"
  ]),
  sourceYear: z.coerce.number()
    .min(1998, "Ano inválido")
    .max(new Date().getFullYear())
    .optional()
    .or(z.literal("")),
  motivationalTexts: z.array(motivationalTextSchema).min(1, "Adicione pelo menos um texto motivador"),
}).superRefine((data, ctx) => {
  if (data.sourceType !== "AUTORAL" && !data.sourceYear) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O ano é obrigatório para temas do ENEM",
      path: ["sourceYear"]
    });
  }
});

export type CreateTopicSchema = z.infer<typeof createTopicSchema>;