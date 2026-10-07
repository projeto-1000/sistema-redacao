import { z } from "zod";

export const step1Schema = z.object({
  educationLevel: z.string({ error: (issue) => issue.input === undefined ? "Obrigatório" : undefined }).min(1),
  schoolType: z.string({ error: (issue) => issue.input === undefined ? "Obrigatório" : undefined }).min(1),
  knowsCourse: z.enum(["yes", "no"]),
  course: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.knowsCourse === "yes" && (!data.course || data.course.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Por favor, selecione o curso.",
      path: ["course"],
    });
  }
});

export const step2Schema = z.object({
  state: z.string({ error: (issue) => issue.input === undefined ? "Obrigatório" : undefined }).min(2),
  city: z.string({ error: (issue) => issue.input === undefined ? "Obrigatório" : undefined }).min(1),
});

export const onboardingSchema = step1Schema.and(step2Schema);

export type OnboardingSchema = z.infer<typeof onboardingSchema>;
