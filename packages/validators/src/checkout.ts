import {
  isValidCardCvv,
  isValidCardExpiration,
  isValidCardNumber,
  isValidCPF,
} from "@repo/utils";
import { z } from "zod";

export const checkoutAddressSchema = z.object({
  zipCode: z.string().refine(
    (value) => value.replace(/\D/g, "").length === 8,
    "Digite um CEP válido."
  ),

  street: z
    .string()
    .trim()
    .min(3, "A rua deve ter pelo menos 3 caracteres."),

  number: z
    .string()
    .trim()
    .min(1, "O número é obrigatório.")
    .max(20, "O número é muito longo."),

  complement: z
    .string()
    .trim()
    .max(100, "O complemento é muito longo.")
    .optional(),

  neighborhood: z
    .string()
    .trim()
    .min(2, "O bairro é obrigatório."),

  city: z
    .string()
    .trim()
    .min(2, "A cidade é obrigatória."),

  state: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, "Digite a UF com 2 letras.")
    .transform((value) => value.toUpperCase()),
});


export const checkoutPaymentMethodSchema = z.enum([
  "credit_card",
  "debit_card",
  "boleto",
]);

export const checkoutPaymentSchema = z
  .object({
    method: checkoutPaymentMethodSchema,

    installments: z.number().int().min(1).max(1).default(1),
    
    cardNumber: z.string().optional(),
    holderName: z.string().optional(),
    holderDocument: z.string().optional(),
    expirationDate: z.string().optional(),
    cvv: z.string().optional(),
    saveCard: z.boolean().default(false)
  })
  .superRefine((value, context) => {
    if (value.method === "boleto") {
      return;
    }

    if (!value.cardNumber) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cardNumber"],
        message: "Digite o número do cartão.",
      });

      return;
    }

    if (!isValidCardNumber(value.cardNumber)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cardNumber"],
        message: "Digite um número de cartão válido.",
      });
    }

    if (!value.holderName || value.holderName.trim().length < 3) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["holderName"],
        message: "Digite o nome impresso no cartão.",
      });
    }

    if (value.holderName && value.holderName.trim().length > 64) {
    context.addIssue({
    code: z.ZodIssueCode.custom,
    path: ["holderName"],
    message: "O nome deve ter no máximo 64 caracteres.",
  });
}

    if (
    value.holderName &&
    !/^[A-Za-zÀ-ÿ\s]+$/.test(value.holderName.trim())
    ) {
    context.addIssue({
    code: z.ZodIssueCode.custom,
    path: ["holderName"],
    message: "O nome deve conter apenas letras e espaços.",
  });
}

    if (!value.holderDocument) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["holderDocument"],
        message: "Digite o CPF do titular.",
      });

      return;
    }

    if (!isValidCPF(value.holderDocument)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["holderDocument"],
        message: "Digite um CPF válido.",
      });
    }

    if (!value.expirationDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expirationDate"],
        message: "Digite a validade do cartão.",
      });

      return;
    }

    if (!isValidCardExpiration(value.expirationDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expirationDate"],
        message: "Digite uma validade válida.",
      });
    }

    if (!value.cvv) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cvv"],
        message: "Digite o CVV.",
      });

      return;
    }

    if (!isValidCardCvv(value.cvv)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cvv"],
        message: "Digite um CVV válido.",
      });
    }
  });

export const checkoutSchema = z.object({
  address: checkoutAddressSchema,
  payment: checkoutPaymentSchema,
});

export type CheckoutAddressFormInput = z.input<typeof checkoutAddressSchema>;
export type CheckoutAddressFormValues = z.infer<typeof checkoutAddressSchema>;

export type CheckoutPaymentFormInput = z.input<typeof checkoutPaymentSchema>;
export type CheckoutPaymentFormValues = z.infer<typeof checkoutPaymentSchema>;

export type CheckoutFormInput = z.input<typeof checkoutSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutSchema>;