import { z } from "zod";
import { checkoutAddressSchema } from "./checkout";

export const addPaymentCardSchema = z
  .object({
    cardToken: z
      .string()
      .trim()
      .regex(/^token_[A-Za-z0-9]+$/, "Token do cartão inválido."),
    billingAddress: checkoutAddressSchema,
  })
  .strict();

export const savedPaymentCardIdSchema = z.string().uuid("Cartão inválido.");

export type AddPaymentCardInput = z.input<typeof addPaymentCardSchema>;
