import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
  interval: z.enum(['day', 'week', 'month', 'year', 'lifetime'], {
    required_error: "Selecione o intervalo de cobrança.",
  }),
  interval_count: z.coerce.number({ required_error: "Selecione a recorrência." }).min(1),
price: z.coerce.number().min(0, "O valor não pode ser negativo."),
  credits_included: z.coerce.number().min(1, "O plano deve incluir pelo menos 1 redação."),
  credits_expiration_days: z.coerce.number().min(1, "Defina os dias de validade dos créditos."),
  is_active: z.boolean().default(true),
  description: z.string().optional(),
});

export type CreatePlanFormValues = z.infer<typeof createPlanSchema>;
export type CreatePlanFormInput = z.input<typeof createPlanSchema>;