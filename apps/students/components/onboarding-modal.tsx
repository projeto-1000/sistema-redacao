"use client";

import { completeStudentOnboarding } from "@/app/actions/onboarding";
import { useLocation } from "@/hooks/use-location";
import { AVAILABLE_COURSES } from "@repo/constants";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Logo } from "@repo/ui/components/logo";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { step1Schema, step2Schema, type OnboardingSchema } from "@repo/validators";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

export type OnboardingCompletionResult =
  | {
      nextStep: "DONE";
      freeCreditExpiresAt: null;
    }
  | {
      nextStep: "HOTMART_MENTORSHIP_REMINDER";
      freeCreditExpiresAt: null;
    }
  | {
      nextStep: "FREE_CREDIT_REMINDER";
      freeCreditExpiresAt: string;
    };

interface OnboardingModalProps {
  open: boolean;
  onCompleted: (result: OnboardingCompletionResult) => void;
}

const EDUCATION_LEVELS = [
  "9º Ano",
  "1º Ano EM",
  "2º Ano EM",
  "3º Ano EM",
  "Cursinho",
  "Superior Completo",
] as const;

const SCHOOL_TYPES = ["Ensino Privado", "Ensino Público"] as const;

export function OnboardingModal({ open, onCompleted }: OnboardingModalProps) {
  const { states, cities, loadCities, isLoadingCities } = useLocation();

  const [step, setStep] = useState<1 | 2>(1);

  const form = useForm<OnboardingSchema>({
    defaultValues: {
      educationLevel: "",
      schoolType: "",
      knowsCourse: "no",
      course: "",
      state: "",
      city: "",
    },
  });

  const { isSubmitting } = form.formState;

  const knowsCourse = form.watch("knowsCourse");
  const selectedUF = form.watch("state");
  const currentValues = form.watch();

  const isStep1Valid = step1Schema.safeParse(currentValues).success;

  const isStep2Valid = step2Schema.safeParse(currentValues).success;

  const onSubmit: SubmitHandler<OnboardingSchema> = async (data) => {
    const result = await completeStudentOnboarding(data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    if (result.nextStep === "HOTMART_MENTORSHIP_REMINDER") {
      onCompleted({
        nextStep: "HOTMART_MENTORSHIP_REMINDER",
        freeCreditExpiresAt: null,
      });

      return;
    }

    if (result.nextStep === "FREE_CREDIT_REMINDER") {
      onCompleted({
        nextStep: "FREE_CREDIT_REMINDER",
        freeCreditExpiresAt: result.freeCreditExpiresAt,
      });

      return;
    }

    toast.success("Tudo pronto! Vamos começar.");

    onCompleted({
      nextStep: "DONE",
      freeCreditExpiresAt: null,
    });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="flex h-[90dvh] min-w-[80%] flex-col gap-0 overflow-y-auto rounded-3xl border-0 bg-white p-0 sm:flex-row xl:min-w-[70%]"
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Onboarding do aluno</DialogTitle>
        </DialogHeader>

        <div className="flex w-full flex-col justify-between bg-linear-to-bl from-[#0f55de] to-[#042060] p-6 text-white sm:w-[40%] md:p-8 xl:p-10">
          <div>
            <div className="flex min-w-full items-center justify-center">
              <Logo variant="white" className="h-18 object-contain sm:h-32" />
            </div>

            <h1 className="mt-6 text-[22px] leading-[1.1] font-bold tracking-tight sm:text-[26px] xl:mt-8 xl:text-[30px]">
              Vamos preparar o seu caminho para a sua nota 1000.
            </h1>

            <p className="mt-5 text-[13px] leading-relaxed text-blue-100/90 md:text-[15px]">
              Precisamos de algumas informações rápidas para personalizar sua jornada, recomendar
              temas de redação e ajustar os critérios de correção dos nossos professores ao seu
              perfil.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col p-6 sm:w-[60%] md:p-8 xl:p-10">
          <div className="mb-8 flex items-center justify-end">
            <div className="flex gap-1.5">
              <div
                className={`h-1.5 w-6 rounded-full transition-colors duration-300 ${
                  step >= 1 ? "bg-[#0A4BCC]" : "bg-slate-200"
                }`}
              />

              <div
                className={`h-1.5 w-6 rounded-full transition-colors duration-300 ${
                  step >= 2 ? "bg-[#0A4BCC]" : "bg-slate-200"
                }`}
              />
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <div className="relative w-full flex-1 overflow-hidden">
                <div
                  className="flex h-full w-full transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${(step - 1) * 100}%)`,
                  }}
                >
                  <div className="h-full w-full shrink-0 space-y-7 px-1">
                    <FormField
                      control={form.control}
                      name="educationLevel"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <div>
                            <FormLabel className="font-bold">Qual seu ano letivo?</FormLabel>

                            <p className="mt-0.5 text-[13px] text-slate-500">
                              Isso nos ajuda a definir o nível de exigência das correções.
                            </p>
                          </div>

                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="grid grid-cols-3 gap-2.5"
                            >
                              {EDUCATION_LEVELS.map((educationLevel) => (
                                <FormItem key={educationLevel}>
                                  <FormControl>
                                    <RadioGroupItem
                                      value={educationLevel}
                                      className="peer sr-only"
                                    />
                                  </FormControl>

                                  <FormLabel className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-center text-[12px] font-medium text-slate-600 transition-all peer-data-[state=checked]:border-[#0A4BCC] peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:text-[#0A4BCC] hover:bg-slate-50 sm:text-[13px]">
                                    {educationLevel}
                                  </FormLabel>
                                </FormItem>
                              ))}

                              <FormItem className="col-span-3">
                                <FormControl>
                                  <RadioGroupItem
                                    value="Superior Incompleto"
                                    className="peer sr-only"
                                  />
                                </FormControl>

                                <FormLabel className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-[12px] font-medium text-slate-600 transition-all peer-data-[state=checked]:border-[#0A4BCC] peer-data-[state=checked]:bg-blue-50 peer-data-[state=checked]:text-[#0A4BCC] hover:bg-slate-50 sm:text-[13px]">
                                  Superior Incompleto
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schoolType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="font-bold">
                            Estudou em qual tipo de instituição?
                          </FormLabel>

                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="grid grid-cols-2 gap-3"
                            >
                              {SCHOOL_TYPES.map((schoolType) => (
                                <FormItem
                                  key={schoolType}
                                  className="flex cursor-pointer items-center rounded-xl border border-slate-200 px-3 py-2 transition-all hover:bg-slate-50 has-data-[state=checked]:border-[#0A4BCC] md:px-4"
                                >
                                  <FormControl>
                                    <RadioGroupItem
                                      value={schoolType}
                                      className="border-slate-400"
                                    />
                                  </FormControl>

                                  <FormLabel className="w-full cursor-pointer text-[12px] font-medium text-slate-700 sm:text-[13px]">
                                    {schoolType}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="knowsCourse"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="block leading-tight font-bold">
                              Já sabe qual curso quer fazer?
                            </FormLabel>

                            <FormControl>
                              <RadioGroup
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);

                                  if (value === "no") {
                                    form.setValue("course", "", {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    });
                                  }
                                }}
                                className="flex gap-4"
                              >
                                <FormItem className="flex items-center space-y-0 space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="yes" className="text-[#0A4BCC]" />
                                  </FormControl>

                                  <FormLabel className="font-medium text-slate-700">Sim</FormLabel>
                                </FormItem>

                                <FormItem className="flex items-center space-y-0 space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="no" className="text-[#0A4BCC]" />
                                  </FormControl>

                                  <FormLabel className="font-medium text-slate-700">Não</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {knowsCourse === "yes" && (
                        <FormField
                          control={form.control}
                          name="course"
                          render={({ field }) => (
                            <FormItem>
                              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className="focus-visible:border-secondary focus-visible:ring-secondary focus:border-secondary focus:ring-secondary mt-1 min-h-11 w-auto rounded-xl border-transparent bg-slate-200 font-medium text-slate-800 focus:ring-0 focus-visible:ring-1">
                                    <SelectValue placeholder="Selecione o curso" />
                                  </SelectTrigger>
                                </FormControl>

                                <SelectContent>
                                  {AVAILABLE_COURSES.map((course) => (
                                    <SelectItem key={course} value={course}>
                                      {course}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  <div className="h-full w-full shrink-0 space-y-7 px-1">
                    <div className="space-y-3">
                      <FormLabel className="text-lg font-bold">De onde você é?</FormLabel>

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);

                                form.resetField("city", {
                                  defaultValue: "",
                                });

                                void loadCities(value);
                              }}
                            >
                              <FormControl>
                                <SelectTrigger className="min-h-11 w-auto rounded-xl border-transparent bg-slate-200 font-medium text-slate-800 focus:border-[#0A4BCC] focus:ring-0 focus:ring-[#0A4BCC] focus-visible:border-[#0A4BCC] focus-visible:ring-1 focus-visible:ring-[#0A4BCC]">
                                  <SelectValue placeholder="Selecione o Estado" />
                                </SelectTrigger>
                              </FormControl>

                              <SelectContent>
                                {states.map((state) => (
                                  <SelectItem key={state.sigla} value={state.sigla}>
                                    {state.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                              disabled={!selectedUF || isLoadingCities}
                            >
                              <FormControl>
                                <SelectTrigger
                                  disabled={!selectedUF || isLoadingCities}
                                  className="min-h-11 w-auto rounded-xl border-transparent bg-slate-200 text-slate-800 focus:border-[#0A4BCC] focus:ring-0 focus:ring-[#0A4BCC] focus-visible:border-[#0A4BCC] focus-visible:ring-1 focus-visible:ring-[#0A4BCC]"
                                >
                                  <SelectValue
                                    placeholder={
                                      isLoadingCities
                                        ? "Carregando cidades..."
                                        : "Selecione a Cidade"
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>

                              <SelectContent>
                                {cities.map((city) => (
                                  <SelectItem key={city.nome} value={city.nome}>
                                    {city.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex items-center pt-6">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="font-medium text-slate-500 hover:text-slate-800"
                  >
                    <ChevronLeft className="size-6 sm:size-4" />

                    <span className="ml-1 hidden lg:block">Voltar</span>
                  </Button>
                )}

                <div className="ml-auto">
                  {step === 1 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-12 rounded-xl bg-[#0f55de] font-bold text-white hover:bg-[#0f55de]/90"
                      disabled={!isStep1Valid}
                      onClick={() => setStep(2)}
                    >
                      Próximo passo
                      <ArrowRight className="ml-1 size-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="secondary"
                      className="h-12 rounded-xl bg-[#0f55de] font-bold text-white hover:bg-[#0f55de]/90"
                      disabled={!isStep2Valid || isSubmitting}
                      isLoading={isSubmitting}
                      loadingText="Salvando..."
                    >
                      Começar minha jornada
                      <ArrowRight className="ml-1 size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
