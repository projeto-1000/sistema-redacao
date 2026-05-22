import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
  billing_cycle: z.enum(['monthly', 'quarterly', 'lifetime'], {
    required_error: "Selecione a recorrência.",
  }),
price: z.coerce.number({ invalid_type_error: "Digite um valor válido." }).min(0.01, "O valor deve ser maior que zero."),
  credits_included: z.coerce.number().min(1, "O plano deve incluir pelo menos 1 redação."),
  is_active: z.boolean().default(true),
  description: z.string().optional(),
});

export type CreatePlanFormValues = z.infer<typeof createPlanSchema>;

export type CreatePlanFormInput = z.input<typeof createPlanSchema>;