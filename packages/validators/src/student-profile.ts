import { onlyDigits } from "@repo/utils";
import { z } from "zod";

export const updateStudentProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "Informe o nome completo do aluno.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = onlyDigits(value);
      return digits.length === 10 || digits.length === 11;
    }, "Informe um telefone válido com DDD."),
});

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;
