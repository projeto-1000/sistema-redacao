import { isValidCPF, onlyDigits } from "@repo/utils";
import { z } from "zod";

const teacherProfileFieldsSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Informe o nome completo do professor.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),
  document: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || onlyDigits(value).length === 11,
      "Informe um CPF com 11 dígitos."
    ),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      if (value === "") return true;

      const digits = onlyDigits(value);
      return digits.length === 10 || digits.length === 11;
    }, "Informe um telefone válido com DDD."),
  correction_review_required: z.boolean(),
});

export function createUpdateTeacherProfileSchema(
  currentDocument?: string | null
) {
  const currentDocumentDigits = onlyDigits(currentDocument ?? "");

  return teacherProfileFieldsSchema.superRefine((values, context) => {
    const documentDigits = onlyDigits(values.document);
    const documentWasPreserved =
      documentDigits !== "" && documentDigits === currentDocumentDigits;

    if (
      documentDigits !== "" &&
      !documentWasPreserved &&
      !isValidCPF(documentDigits)
    ) {
      context.addIssue({
        code: "custom",
        path: ["document"],
        message: "Informe um CPF válido.",
      });
    }
  });
}

export const updateTeacherProfileSchema =
  createUpdateTeacherProfileSchema();

export type UpdateTeacherProfileInput = z.infer<
  typeof updateTeacherProfileSchema
>;
