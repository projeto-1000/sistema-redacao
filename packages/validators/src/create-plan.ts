import { z } from "zod";

export const createPlanSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "O nome deve ter no mínimo 3 caracteres.")
    .max(64, "O nome deve ter no máximo 64 caracteres."),
  interval: z.enum(["day", "week", "month", "year", "lifetime"], {
    required_error: "Selecione o intervalo de cobrança.",
  }),
  interval_count: z.coerce
    .number({ required_error: "Selecione a recorrência." })
    .min(1),
  price: z.coerce.number().min(0, "O valor não pode ser negativo."),
  credits_included: z.coerce
    .number()
    .min(1, "O plano deve incluir pelo menos 1 redação."),
  credits_expiration_days: z.coerce
    .number()
    .min(1, "Defina os dias de validade dos créditos."),
  is_active: z.boolean().default(true),
  is_public: z.boolean().default(true),
  is_recommended: z.boolean().default(false),
  discount_percentage: z.coerce
    .number()
    .int("O desconto deve ser um número inteiro.")
    .min(0, "O desconto não pode ser negativo.")
    .max(100, "O desconto não pode ser maior que 100%.")
    .nullable()
    .default(null),
  sort_order: z.coerce
    .number()
    .int("A ordem deve ser um número inteiro.")
    .min(0, "A ordem não pode ser negativa.")
    .default(0),
  description: z
    .string()
    .trim()
    .max(256, "A descrição deve ter no máximo 256 caracteres.")
    .optional(),
  features: z.array(z.string().trim().min(1)).default([]),
});

export type CreatePlanFormValues = z.infer<typeof createPlanSchema>;
export type CreatePlanFormInput = z.input<typeof createPlanSchema>;
