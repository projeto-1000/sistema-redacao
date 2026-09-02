import { z } from "zod";

const extraCreditPackageFieldsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "O nome deve ter no mínimo 3 caracteres.")
      .max(64, "O nome deve ter no máximo 64 caracteres."),
    description: z
      .string()
      .trim()
      .max(2000, "A descrição deve ter no máximo 2000 caracteres.")
      .nullable()
      .optional(),
    credits_amount: z.coerce
      .number()
      .int("A quantidade de créditos deve ser um número inteiro.")
      .positive("A quantidade de créditos deve ser maior que zero."),
    price_cents: z.coerce
      .number()
      .int("O preço deve ser informado em centavos inteiros.")
      .positive("O preço deve ser maior que zero."),
    is_active: z.boolean().default(true),
  })
  .strict();

export const createExtraCreditPackageSchema = extraCreditPackageFieldsSchema;

export const updateExtraCreditPackageSchema = extraCreditPackageFieldsSchema
  .omit({ is_active: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const setExtraCreditPackageStatusSchema = z
  .object({
    id: z.string().uuid("Pacote de créditos inválido."),
    is_active: z.boolean(),
  })
  .strict();

export const extraCreditPackageIdSchema = z
  .string()
  .uuid("Pacote de créditos inválido.");

export type CreateExtraCreditPackageInput = z.input<
  typeof createExtraCreditPackageSchema
>;
export type UpdateExtraCreditPackageInput = z.input<
  typeof updateExtraCreditPackageSchema
>;
