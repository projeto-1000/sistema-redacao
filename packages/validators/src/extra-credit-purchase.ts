import { z } from "zod";
import { checkoutAddressSchema } from "./checkout";

const purchaseIdentitySchema = z.object({
  packageId: z.string().uuid("Pacote de créditos inválido."),
  operationId: z.string().uuid("Operação de compra inválida."),
});

export const purchaseExtraCreditsSchema = z.discriminatedUnion(
  "paymentSource",
  [
    purchaseIdentitySchema
      .extend({
        paymentSource: z.literal("saved_card"),
        paymentCardId: z.string().uuid("Cartão inválido."),
      })
      .strict(),
    purchaseIdentitySchema
      .extend({
        paymentSource: z.literal("new_card"),
        cardToken: z
          .string()
          .trim()
          .regex(/^token_[A-Za-z0-9]+$/, "Token do cartão inválido."),
        billingAddress: checkoutAddressSchema,
      })
      .strict(),
  ],
);

export type PurchaseExtraCreditsInput = z.input<
  typeof purchaseExtraCreditsSchema
>;
