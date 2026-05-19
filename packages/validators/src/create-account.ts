import { z } from "zod";

export const commonSchema = z.object({
  ownerName: z.string().min(3, "O nome do titular é obrigatório."),
  ownerDocument: z.string().superRefine((val, ctx) => {
  const numbers = val.replace(/\D/g, "");

  if (!numbers) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O CPF ou CNPJ é obrigatório." });
    return;
  }

  const isCpf = numbers.length <= 11;
  const regex = isCpf ? /^\d{3}\.\d{3}\.\d{3}-\d{2}$/ : /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
  const errorMessage = isCpf ? "Digite um CPF válido completo." : "Digite um CNPJ válido completo.";

  if (!regex.test(val)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: errorMessage });
  }
}),
  isDefault: z.boolean().default(false),
});

export const accountFormSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("pix"),
    pixType: z.enum(["cpf", "cnpj", "phone", "email", "random"]),
    pixKey: z.string().min(1, "A chave PIX é obrigatória."),
  }),
  
  z.object({
    type: z.literal("bank_account"),
    bankName: z.string().min(2, "O nome do banco é obrigatório."),
    accountVariant: z.enum(["corrente", "poupanca"]),
    agency: z.string().min(1, "A agência é obrigatória."),
    accountNumber: z.string().min(1, "O número da conta é obrigatório."),
  }),
])
.and(commonSchema)
.superRefine((data, ctx) => {
  if (data.type === "pix" && data.pixKey) {
    if (data.pixType === "cpf" && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(data.pixKey)) {
      ctx.addIssue({ path: ["pixKey"], code: z.ZodIssueCode.custom, message: "Digite um CPF válido e completo." });
    } 
    else if (data.pixType === "cnpj" && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(data.pixKey)) {
      ctx.addIssue({ path: ["pixKey"], code: z.ZodIssueCode.custom, message: "Digite um CNPJ válido e completo." });
    } 
    else if (data.pixType === "phone" && !/^\(\d{2}\) \d{5}-\d{4}$/.test(data.pixKey)) {
      ctx.addIssue({ path: ["pixKey"], code: z.ZodIssueCode.custom, message: "Digite um telefone válido com DDD." });
    } 
    else if (data.pixType === "email" && !z.string().email().safeParse(data.pixKey).success) {
      ctx.addIssue({ path: ["pixKey"], code: z.ZodIssueCode.custom, message: "Digite um e-mail válido." });
    }
  }
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;
