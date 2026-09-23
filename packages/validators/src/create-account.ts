import { z } from "zod";
import { isValidCNPJ, isValidCPF } from "@repo/utils";

const cleanDocument = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

export const commonSchema = z.object({
  ownerName: z.string().trim().min(3, "O nome do titular deve ter pelo menos 3 caracteres.").max(120, "O nome do titular deve ter até 120 caracteres."),
  ownerDocument: z.string().trim().min(1, "O CPF ou CNPJ é obrigatório.").max(18, "O CPF ou CNPJ é muito longo."),
  isDefault: z.boolean().default(false),
});

export const accountFormSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("pix"),
    pixType: z.enum(["cpf", "cnpj", "phone", "email", "random"]),
    pixKey: z.string().trim().min(1, "A chave PIX é obrigatória.").max(254, "A chave PIX é muito longa."),
  }),
  
  z.object({
    type: z.literal("bank_account"),
    bankName: z.string().trim().min(2, "O nome do banco é obrigatório.").max(120, "O nome do banco deve ter até 120 caracteres."),
    accountVariant: z.enum(["corrente", "poupanca"]),
    agency: z.string().trim().min(1, "A agência é obrigatória.").max(4, "A agência deve ter até 4 dígitos.").regex(/^\d+$/, "Use apenas números na agência."),
    accountNumber: z.string().trim().min(1, "O número da conta é obrigatório.").max(20, "A conta deve ter até 20 dígitos.").regex(/^\d+$/, "Use apenas números na conta."),
  }),
])
.and(commonSchema)
.superRefine((data, ctx) => {
  const document = cleanDocument(data.ownerDocument);
  const isValidDocument = /^\d{11}$/.test(document)
    ? isValidCPF(document)
    : document.length === 14 && isValidCNPJ(document);

  if (!isValidDocument) {
    ctx.addIssue({ path: ["ownerDocument"], code: z.ZodIssueCode.custom, message: "Informe um CPF ou CNPJ válido." });
  }

  if (data.type !== "pix") return;

  const validPixKey = {
    cpf: () => isValidCPF(data.pixKey),
    cnpj: () => isValidCNPJ(data.pixKey),
    phone: () => /^\(\d{2}\) \d{5}-\d{4}$/.test(data.pixKey),
    email: () => z.string().email().max(254).safeParse(data.pixKey).success,
    random: () => z.string().uuid().safeParse(data.pixKey).success,
  }[data.pixType]();

  if (!validPixKey) {
    ctx.addIssue({ path: ["pixKey"], code: z.ZodIssueCode.custom, message: "Informe uma chave PIX válida para o tipo selecionado." });
  }
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;
