import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Digite um e-mail válido" }),
  password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres" }),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirme sua senha"), 
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
  document: z.string().optional(),
  phone: z.string().optional(),
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

  // 💡 Validação condicional baseada na role
  if (data.role !== "ADMIN") {
    if (!data.document || data.document.length < 11) {
      ctx.addIssue({
        code: "custom",
        path: ["cpf"],
        message: "CPF é obrigatório para este cadastro",
      });
    }
    if (!data.phone || data.phone.length < 10) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Celular é obrigatório para este cadastro",
      });
    }
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