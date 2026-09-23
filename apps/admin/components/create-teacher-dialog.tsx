"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { teacherInviteSchema, type TeacherInviteInput } from "@repo/validators";
import { formatCPF, formatPhone } from "@repo/utils";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Plus, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface CreateTeacherDialogProps {
  onCreate: (input: TeacherInviteInput) => Promise<{ success: boolean; error?: string }>;
}

const defaults: TeacherInviteInput = {
  fullName: "",
  email: "",
  document: "",
  phone: "",
  correction_review_required: true,
};

export function CreateTeacherDialog({ onCreate }: CreateTeacherDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<TeacherInviteInput>({
    resolver: zodResolver(teacherInviteSchema),
    defaultValues: defaults,
    mode: "onChange",
  });

  const submit = async (values: TeacherInviteInput) => {
    try {
      const result = await onCreate(values);
      if (!result.success) {
        form.setError("root", { message: result.error ?? "Não foi possível cadastrar o professor." });
        return;
      }

      toast.success("Professor cadastrado. O convite foi enviado por e-mail.");
      form.reset(defaults);
      setOpen(false);
    } catch {
      form.setError("root", { message: "Não foi possível cadastrar o professor. Tente novamente." });
    }
  };

  const inputClassName = "h-12 rounded-xl border-slate-200";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) form.reset(defaults);
    }}>
      <DialogTrigger asChild>
        <Button className="h-10 w-full rounded-xl font-bold shadow-sm sm:w-auto">
          <Plus className="mr-2 size-4" />
          Adicionar Novo Professor
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Cadastrar professor</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-5 pt-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl><Input {...field} autoComplete="name" maxLength={120} placeholder="Nome do professor" className={inputClassName} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>E-mail</FormLabel>
                  <FormControl><Input {...field} type="email" autoComplete="email" maxLength={254} placeholder="professor@exemplo.com" className={inputClassName} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="document" render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl><Input {...field} value={field.value} onChange={(event) => field.onChange(formatCPF(event.target.value))} inputMode="numeric" maxLength={14} placeholder="000.000.000-00" className={inputClassName} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input {...field} value={field.value} onChange={(event) => field.onChange(formatPhone(event.target.value))} inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" className={inputClassName} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="correction_review_required" render={({ field }) => (
              <FormItem className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
                <div className="flex items-start gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-label="Exigir revisão"
                      className="mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="flex cursor-pointer items-center gap-2 font-bold text-slate-700"><ShieldCheck className="size-4 text-indigo-600" />Exigir revisão do admin</FormLabel>
                    <p className="text-sm text-slate-600">As correções deste professor só serão liberadas aos alunos após revisão e aprovação de um administrador.</p>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {form.formState.errors.root?.message && <p role="alert" className="text-sm text-red-600">{form.formState.errors.root.message}</p>}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 rounded-xl">Cancelar</Button>
              <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting} isLoading={form.formState.isSubmitting} loadingText="Cadastrando..." className="h-11 rounded-xl">
                Cadastrar e enviar convite
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
