import { isValidCPF, onlyDigits } from "@repo/utils";
import { z } from "zod";

export const teacherInviteSchema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo.").max(120, "O nome deve ter até 120 caracteres."),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(254, "O e-mail é muito longo."),
  document: z.string().refine(isValidCPF, "Informe um CPF válido."),
  phone: z.string().refine((value) => {
    const digits = onlyDigits(value);
    return digits.length === 10 || digits.length === 11;
  }, "Informe um telefone com DDD válido."),
  correction_review_required: z.boolean(),
});

export type TeacherInviteInput = z.infer<typeof teacherInviteSchema>;
