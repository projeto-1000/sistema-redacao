import { isValidCPF, onlyDigits } from "@repo/utils";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Digite um e-mail válido" }),
  password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres" }),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirme sua senha"), 
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
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
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "As senhas não coincidem",
    });
  }
});

export const setPasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirme sua senha"), 
    terms: z.boolean().refine((val) => val === true, {
    message: "Você precisa aceitar os termos de uso e privacidade.",
  }),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "As senhas não coincidem",
    });
  }
});

export const updatePasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirme sua senha"), 
}).superRefine((data, ctx) => {
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
export type RegisterSchema = z.infer<typeof registerSchema>;
export type SetPasswordSchema = z.infer<typeof setPasswordSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>;