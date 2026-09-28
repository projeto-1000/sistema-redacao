import { isValidCPF, onlyDigits } from "@repo/utils";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Digite um e-mail válido" }),
  password: z
    .string()
    .min(6, { message: "A senha deve ter no mínimo 6 caracteres" }),
});

const hasSequentialNumbers = (value: string) => {
  const digits = value.match(/\d+/g) ?? [];

  return digits.some((sequence) => {
    for (let index = 0; index <= sequence.length - 3; index += 1) {
      const first = Number(sequence[index]);
      const second = Number(sequence[index + 1]);
      const third = Number(sequence[index + 2]);

      if (
        (second === first + 1 && third === second + 1) ||
        (second === first - 1 && third === second - 1)
      ) {
        return true;
      }
    }

    return false;
  });
};

const SUPABASE_PASSWORD_SYMBOLS = "!@#$%^&*()_+-=[]{};':\"|<>?,./`~";

export const passwordRequirements = [
  {
    id: "minimum-length",
    label: "No mínimo 6 caracteres",
    test: (value: string) => value.length >= 6,
    message: "A senha deve ter no mínimo 6 caracteres",
  },
  {
    id: "uppercase-letter",
    label: "Uma letra maiúscula",
    test: (value: string) => /[A-Z]/.test(value),
    message: "A senha deve conter pelo menos uma letra maiúscula",
  },
  {
    id: "lowercase-letter",
    label: "Uma letra minúscula",
    test: (value: string) => /[a-z]/.test(value),
    message: "A senha deve conter pelo menos uma letra minúscula",
  },
  {
    id: "number",
    label: "Um número",
    test: (value: string) => /\d/.test(value),
    message: "A senha deve conter pelo menos um número",
  },
  {
    id: "special-character",
    label: "Um caractere especial",
    test: (value: string) =>
      [...value].some((character) =>
        SUPABASE_PASSWORD_SYMBOLS.includes(character),
      ),
    message: "A senha deve conter pelo menos um caractere especial",
  },
  {
    id: "numeric-pattern",
    label: "Sem 3 números iguais ou em sequência",
    test: (value: string) =>
      !/(\d)\1{2}/.test(value) && !hasSequentialNumbers(value),
    message: "A senha não pode conter 3 números iguais ou em sequência",
  },
] as const;

export const passwordSchema = z.string().superRefine((value, ctx) => {
  passwordRequirements.forEach((requirement) => {
    if (!requirement.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: requirement.message,
      });
    }
  });
});

export const registrationDetailsSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  email: z.string().trim().email("Email inválido"),
  document: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine((value) => isValidCPF(value), "CPF inválido"),
  phoneCountryCode: z
    .string()
    .default("55")
    .refine((value) => {
      const digits = onlyDigits(value);
      return digits.length >= 1 && digits.length <= 4;
    }, "Código do país inválido"),
  phone: z
    .string()
    .min(1, "Celular é obrigatório")
    .refine((value) => {
      const digits = onlyDigits(value);
      return digits.length >= 10 && digits.length <= 15;
    }, "Celular inválido"),
  terms: z.boolean().refine((val) => val === true, {
    message: "Você precisa aceitar os termos de uso e privacidade.",
  }),
});

export const passwordSetupSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "As senhas não coincidem",
      });
    }
  });

export const registerSchema =
  registrationDetailsSchema.and(passwordSetupSchema);

export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme sua senha"),
    terms: z.boolean().refine((val) => val === true, {
      message: "Você precisa aceitar os termos de uso e privacidade.",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "As senhas não coincidem",
      });
    }
  });

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "As senhas não coincidem",
      });
    }
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegistrationDetailsSchema = z.infer<
  typeof registrationDetailsSchema
>;
export type PasswordSetupSchema = z.infer<typeof passwordSetupSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type SetPasswordSchema = z.infer<typeof setPasswordSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;
