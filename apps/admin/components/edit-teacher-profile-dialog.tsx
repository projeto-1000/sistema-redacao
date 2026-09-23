"use client";

import { updateTeacherProfile } from "@/app/actions/teachers";
import type { TeacherProfile } from "@repo/types";
import { Avatar } from "@repo/ui/components/avatar";
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
  DialogDescription,
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
import {
  createUpdateTeacherProfileSchema,
  type UpdateTeacherProfileInput,
} from "@repo/validators";
import { formatDocument, formatPhone } from "@repo/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, UserRoundCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface EditTeacherProfileDialogProps {
  teacher: TeacherProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getDefaultValues(teacher: TeacherProfile): UpdateTeacherProfileInput {
  return {
    full_name: teacher.full_name,
    document: teacher.document ? formatDocument(teacher.document) : "",
    phone: teacher.phone ? formatPhone(teacher.phone) : "",
    correction_review_required: teacher.correction_review_required,
  };
}

export function EditTeacherProfileDialog({
  teacher,
  open,
  onOpenChange,
}: EditTeacherProfileDialogProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<UpdateTeacherProfileInput | null>(null);
  const profileSchema = useMemo(
    () => createUpdateTeacherProfileSchema(teacher.document),
    [teacher.document]
  );

  const form = useForm<UpdateTeacherProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: getDefaultValues(teacher),
    mode: "onChange",
  });

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(teacher));
      setPendingValues(null);
      setConfirmDisableOpen(false);
    }
  }, [form, open, teacher]);

  const saveProfile = async (values: UpdateTeacherProfileInput) => {
    setIsSaving(true);

    try {
      const result = await updateTeacherProfile(teacher.id, values);

      if (!result.success) {
        toast.error(result.error ?? "Não foi possível atualizar o professor.");
        return;
      }

      toast.success("Perfil do professor atualizado com sucesso.");
      setPendingValues(null);
      setConfirmDisableOpen(false);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar perfil do professor:", error);
      toast.error("Não foi possível atualizar o professor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (values: UpdateTeacherProfileInput) => {
    if (
      teacher.correction_review_required &&
      !values.correction_review_required
    ) {
      setPendingValues(values);
      setConfirmDisableOpen(true);
      return;
    }

    await saveProfile(values);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (isSaving) return;

    onOpenChange(nextOpen);
  };

  const inputClassName =
    "min-h-11 rounded-xl border-slate-200 bg-slate-50 px-4 text-slate-700 focus-visible:border-blue-400 focus-visible:ring-blue-200";

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-3xl border-none bg-slate-50 p-0 shadow-2xl sm:max-w-4xl">
          <DialogHeader className="border-b border-slate-200 bg-white px-6 py-5 pr-14">
            <DialogTitle className="text-xl font-black ">
              Editar perfil do professor
            </DialogTitle>
            <DialogDescription>
              Atualize os dados pessoais e as configurações de correção.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="overflow-y-auto p-6">
                <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <Avatar
                    src={teacher.avatar_url}
                    name={teacher.full_name}
                    className="size-14 shrink-0 rounded-full border-2 border-slate-200"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-black ">
                      {teacher.full_name}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {teacher.email}
                    </p>
                  </div>
                </div>

                <div className="grid items-stretch gap-6 md:grid-cols-5">
                  <section className="rounded-3xl border border-slate-200 bg-white p-5 md:col-span-3">
                    <div className="mb-5 flex items-center gap-2">
                      <UserRoundCog className="size-5 text-blue-600" />
                      <h3 className="font-black ">Dados pessoais</h3>
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold text-slate-600">
                              Nome completo
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className={inputClassName}
                                autoComplete="name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="document"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-bold text-slate-600">
                              CPF
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className={inputClassName}
                                inputMode="numeric"
                                placeholder="000.000.000-00"
                                onChange={(event) =>
                                  field.onChange(formatDocument(event.target.value))
                                }
                              />
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
                            <FormLabel className="font-bold text-slate-600">
                              Telefone
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className={inputClassName}
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="(00) 00000-0000"
                                onChange={(event) =>
                                  field.onChange(formatPhone(event.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white p-5 md:col-span-2">
                    <div className="mb-5 flex items-center gap-2">
                      <ShieldCheck className="size-5 text-indigo-600" />
                      <h3 className="font-black ">
                        Configurações de correção
                      </h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="correction_review_required"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <div
                            className={`rounded-2xl border p-4 transition-colors ${field.value
                              ? "border-indigo-200 bg-indigo-50/70"
                              : "border-slate-200 bg-slate-50"
                              }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-bold ">
                                  Exigir revisão do admin
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                  As correções passam por revisão antes de chegar ao aluno.
                                </p>
                              </div>

                              <FormControl>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={field.value}
                                  aria-label="Ativar supervisão de correções"
                                  onClick={() => field.onChange(!field.value)}
                                  className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${field.value ? "bg-blue-600" : "bg-slate-300"
                                    }`}
                                >
                                  <span
                                    className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform ${field.value ? "left-6" : "left-1"
                                      }`}
                                  />
                                </button>
                              </FormControl>
                            </div>

                          </div>
                          <p className="mt-3 text-xs leading-relaxed text-slate-500">
                            A mudança vale para os próximos envios. Correções que já aguardam revisão não serão alteradas.
                          </p>
                        </FormItem>
                      )}
                    />
                  </section>
                </div>
              </div>

              <DialogFooter className="border-t border-slate-200 bg-white px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={isSaving}
                  onClick={() => handleDialogOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl"
                  disabled={
                    isSaving || !form.formState.isDirty || !form.formState.isValid
                  }
                  isLoading={isSaving}
                  loadingText="Salvando..."
                >
                  Salvar alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDisableOpen} onOpenChange={setConfirmDisableOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar supervisão?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              As próximas correções deste professor serão publicadas diretamente para o aluno, sem revisão administrativa. Correções que já aguardam revisão não serão alteradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving || !pendingValues}
              onClick={() => {
                if (pendingValues) {
                  void saveProfile(pendingValues);
                }
              }}
            >
              Desativar supervisão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
