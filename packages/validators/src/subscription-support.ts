import { z } from "zod";

export const subscriptionSupportSchema = z
  .object({
    operationId: z.string().uuid(),
    studentId: z.string().uuid(),
    paymentId: z.string().uuid(),
    action: z.enum([
      "cancel_only",
      "cancel_refund",
      "refund_courtesy",
      "refund_only",
    ]),
    amount: z.number().int().nonnegative(),
    reason: z
      .string()
      .trim()
      .min(10, "Descreva o motivo com pelo menos 10 caracteres.")
      .max(1000),
    courtesyCredits: z.number().int().nonnegative().optional(),
    courtesyUntil: z.string().datetime({ offset: true }).optional(),
  })
  .superRefine((input, ctx) => {
    if ((input.action === "cancel_only") !== (input.amount === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Informe um valor válido para esta ação.",
      });
    }
    if (
      input.action === "refund_courtesy" &&
      (input.courtesyCredits === undefined ||
        !input.courtesyUntil ||
        Date.parse(input.courtesyUntil) <= Date.now())
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["courtesyUntil"],
        message: "Defina quantidade e validade futura da cortesia.",
      });
    }
  });
