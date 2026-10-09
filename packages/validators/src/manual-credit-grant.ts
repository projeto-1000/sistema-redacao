import { z } from "zod";

export const manualCreditGrantTypes = ["mentorship", "plan", "extra"] as const;

export const manualCreditGrantReasons = [
  "mentorship_bonus",
  "administrative_adjustment",
  "technical_issue_compensation",
  "credit_replacement",
  "courtesy",
  "promotional_campaign",
  "other",
] as const;

export const manualCreditGrantSchema = z
  .object({
    operationId: z.string().uuid("Operação inválida."),
    studentId: z.string().uuid("Aluno inválido."),
    creditType: z.enum(manualCreditGrantTypes),
    amount: z
      .number()
      .int("Informe uma quantidade inteira.")
      .min(1, "Informe pelo menos 1 crédito.")
      .max(100, "O limite é de 100 créditos por vez."),
    reason: z.enum(manualCreditGrantReasons),
    internalNote: z
      .string()
      .trim()
      .max(1000, "Use no máximo 1000 caracteres.")
      .optional(),
  })
  .superRefine((input, context) => {
    if (
      input.reason === "mentorship_bonus" &&
      input.creditType !== "mentorship"
    ) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Bônus da mentoria só pode ser usado em créditos de mentoria.",
      });
    }

    if (
      ["administrative_adjustment", "other"].includes(input.reason) &&
      !input.internalNote?.trim()
    ) {
      context.addIssue({
        code: "custom",
        path: ["internalNote"],
        message:
          "A observação interna é obrigatória para o motivo selecionado.",
      });
    }
  });

export type ManualCreditGrantInput = z.infer<typeof manualCreditGrantSchema>;
