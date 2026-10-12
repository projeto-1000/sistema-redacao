"use client";

import { sendStudentPasswordReset, updateStudentProfile } from "@/app/actions/students";
import type { StudentProfile } from "@repo/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { formatDocument, formatPhone } from "@repo/utils";
import { updateStudentProfileSchema, type UpdateStudentProfileInput } from "@repo/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface EditStudentProfileDialogProps {
  student: StudentProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getDefaultValues(student: StudentProfile): UpdateStudentProfileInput {
  return {
    full_name: student.full_name,
    phone: student.phone ? formatPhone(student.phone) : "",
  };
}

export function EditStudentProfileDialog({
  student,
  open,
  onOpenChange,
}: EditStudentProfileDialogProps) {
  const router = useRouter();
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const form = useForm<UpdateStudentProfileInput>({
    resolver: zodResolver(updateStudentProfileSchema),
    defaultValues: getDefaultValues(student),
    mode: "onChange",
  });

  useEffect(() => {
    if (open) form.reset(getDefaultValues(student));
  }, [form, open, student]);

  const isBusy = form.formState.isSubmitting || isResetting;
  const canSave = form.formState.isValid && form.formState.isDirty && !isBusy;

  const handleSave = async (values: UpdateStudentProfileInput) => {
    const result = await updateStudentProfile(student.id, values);

    if (!result.success) {
      toast.error(result.error ?? "Não foi possível atualizar o aluno.");
      return;
    }

    toast.success("Perfil do aluno atualizado com sucesso.");
    onOpenChange(false);
    router.refresh();
  };

  const handlePasswordReset = async () => {
    setIsResetting(true);

    try {
      const result = await sendStudentPasswordReset(student.id);

      if (!result.success) {
        toast.error(result.error ?? "Não foi possível enviar o e-mail.");
        return;
      }

      toast.success("E-mail de redefinição enviado com sucesso.");
      setResetConfirmationOpen(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !isBusy && onOpenChange(nextOpen)}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-3xl border-none bg-white p-0 shadow-2xl sm:max-w-180">
          <DialogHeader className="px-6 pt-6 pr-14 pb-4">
            <DialogTitle className="text-2xl font-black">Editar aluno</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="min-h-0 overflow-y-auto">
              <div className="space-y-6 px-6 pb-6">
                <section>
                  <h3 className="mb-4 font-black">Dados pessoais</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input {...field} autoComplete="name" className="h-11 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              autoComplete="tel"
                              inputMode="numeric"
                              className="h-11 rounded-xl"
                              onChange={(event) => field.onChange(formatPhone(event.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <section>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <Input
                        value={student.email}
                        disabled
                        className="h-11 rounded-xl bg-slate-100 text-slate-500"
                      />
                    </FormItem>

                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <Input
                        value={student.document ? formatDocument(student.document) : "Não informado"}
                        disabled
                        className="h-11 rounded-xl bg-slate-100 text-slate-500"
                      />
                    </FormItem>
                  </div>
                </section>

                <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-violet-100 p-3 text-violet-600">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-black">Recuperação de acesso</h3>
                      <p className="text-sm text-slate-500">
                        Envie um link seguro para o aluno criar uma nova senha.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 rounded-xl border-blue-500 px-5 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => setResetConfirmationOpen(true)}
                    disabled={isBusy}
                  >
                    <Mail className="mr-2 size-4" />
                    Enviar e-mail de redefinição
                  </Button>
                </section>
              </div>

              <DialogFooter className="border-t border-slate-200 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl px-5"
                  onClick={() => onOpenChange(false)}
                  disabled={isBusy}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="h-11 rounded-xl px-5" disabled={!canSave} isLoading={form.formState.isSubmitting} loadingText="Salvando...">
                  Salvar alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resetConfirmationOpen} onOpenChange={setResetConfirmationOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar redefinição de senha?</AlertDialogTitle>
            <AlertDialogDescription>
              Um link de redefinição será enviado para o e-mail cadastrado do aluno. O endereço de
              e-mail não será alterado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11" disabled={isResetting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11"
              onClick={(event) => {
                event.preventDefault();
                void handlePasswordReset();
              }}
              disabled={isResetting}
            >
              {isResetting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmar envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
