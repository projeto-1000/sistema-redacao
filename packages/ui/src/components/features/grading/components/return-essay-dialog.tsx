"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle, Undo } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";

export interface ReturnEssayParams {
  essayId: string;
  reason: string;
  description: string;
  redirectPath: string;
}

interface ReturnEssayDialogProps {
  essayId: string;
  onReturnEssay: (params: ReturnEssayParams) => Promise<{ success: boolean; error?: string }>;
}

const RETURN_REASONS = [
  { value: "incomplete", label: "Redação incompleta" },
  { value: "off_topic", label: "Fuga ao tema" },
  { value: "plagiarism", label: "Suspeita de plágio/cópia" },
  { value: "ai_generated", label: "Uso de Inteligência Artificial" },
  { value: "other", label: "Outros motivos" },
];

const formSchema = z.object({
  reason: z.string().min(1, "Por favor, selecione um motivo."),
  description: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.reason === "other" && (!data.description || data.description.trim().length < 10)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A descrição detalhada é obrigatória (mínimo 10 caracteres).",
      path: ["description"],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

export function ReturnEssayDialog({ essayId, onReturnEssay }: ReturnEssayDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      description: "",
    },
  });

  const selectedReason = form.watch("reason");
  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: FormValues) => {
    const result = await onReturnEssay({
      essayId,
      reason: values.reason,
      description: values.reason === "other" ? values.description! : "",
      redirectPath: pathname,
    });

    if (result.success) {
      toast.success("Redação devolvida e crédito estornado ao aluno.");
      setIsOpen(false);
      form.reset();
    } else {
      toast.error(result.error || "Erro ao tentar devolver a redação.");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) form.reset();
    }}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="h-12 rounded-xl text-red-600 hover:border-red-200! hover:bg-red-50! hover:text-red-700 bg-slate-300 font-medium">
          <Undo /> Devolver Redação
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600 text-[18px]">
            <AlertCircle className="size-4.5" />
            Devolver Redação
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[15px]">
            A ação irá retornar a redação para o aluno e <strong>devolver o crédito</strong> gasto automaticamente. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form id="return-essay-form" onSubmit={form.handleSubmit(onSubmit)} className="py-4 space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da devolução</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger
                        className="w-full rounded-lg min-h-12">
                        <SelectValue placeholder="Selecione um motivo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RETURN_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedReason === "other" && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="animate-in fade-in slide-in-from-top-2">
                    <FormLabel>Descrição do motivo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explique detalhadamente o motivo da devolução..."
                        className="min-h-[100px] resize-none"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting} className="h-11 rounded-xl">Cancelar</AlertDialogCancel>
          <Button
            type="submit"
            form="return-essay-form"
            variant="destructive"
            className="h-11 rounded-xl"
            disabled={isSubmitting || !isValid}
            isLoading={isSubmitting}
            loadingText="Devolvendo..."
          >
            Confirmar Devolução
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}