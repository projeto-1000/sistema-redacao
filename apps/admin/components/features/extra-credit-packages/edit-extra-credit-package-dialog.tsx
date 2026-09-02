"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createExtraCreditPackageSchema,
  type CreateExtraCreditPackageInput,
} from "@repo/validators";
import type { ExtraCreditPackage } from "@repo/types";
import { updateExtraCreditPackage } from "@/app/actions/extra-credit-packages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@repo/ui/components/textarea";
import { Button } from "@repo/ui/components/button";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

interface EditExtraCreditPackageDialogProps {
  packageItem: ExtraCreditPackage;
}

export function EditExtraCreditPackageDialog({
  packageItem,
}: EditExtraCreditPackageDialogProps) {
  const [open, setOpen] = useState(false);

  const [creditsInput, setCreditsInput] = useState(
    String(packageItem.credits_amount)
  );

  const [priceInput, setPriceInput] = useState(
    (packageItem.price_cents / 100)
      .toFixed(2)
      .replace(".", ",")
  );

  /*
   * Usamos o schema de criação no formulário de edição para
   * manter todos os campos exibidos obrigatórios.
   *
   * A action de update continua responsável por aceitar somente
   * os campos permitidos pelo backend.
   */
  const form = useForm<CreateExtraCreditPackageInput>({
    resolver: zodResolver(createExtraCreditPackageSchema),
    defaultValues: {
      name: packageItem.name,
      description: packageItem.description ?? "",
      credits_amount: packageItem.credits_amount,
      price_cents: packageItem.price_cents,
      is_active: packageItem.is_active,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const { isSubmitting, isValid } = form.formState;

  function resetForm() {
    form.reset({
      name: packageItem.name,
      description: packageItem.description ?? "",
      credits_amount: packageItem.credits_amount,
      price_cents: packageItem.price_cents,
      is_active: packageItem.is_active,
    });

    setCreditsInput(
      String(packageItem.credits_amount)
    );

    setPriceInput(
      (packageItem.price_cents / 100)
        .toFixed(2)
        .replace(".", ",")
    );
  }

  const onSubmit = async (
    data: CreateExtraCreditPackageInput
  ) => {
    const result = await updateExtraCreditPackage(
      packageItem.id,
      {
        name: data.name,
        description: data.description,
        credits_amount: data.credits_amount,
        price_cents: data.price_cents,
      }
    );

    if (result.success) {
      setOpen(false);
      toast.success("Pacote editado com sucesso!");
      return;
    }

    toast.error("Erro ao salvar pacote", {
      description:
        result.error || "Tente novamente em instantes.",
    });
  };

  const inputBaseClass =
    "w-full min-h-11 rounded-xl bg-sky-50 border-sky-100 px-4 py-2.5 text-sm text-slate-700 transition-all selection:bg-blue-200";

  const labelClass = "text-sm font-bold text-slate-600";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);

        if (!isOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600"
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:max-w-[600px]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black">
            Editar Pacote de Créditos
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    Nome do pacote
                  </FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Ex: Pacote com 5 créditos"
                      className={inputBaseClass}
                      {...field}
                    />
                  </FormControl>

                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    Descrição
                  </FormLabel>

                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Descrição opcional do pacote..."
                      className={`${inputBaseClass} min-h-28 resize-y`}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </FormControl>

                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="credits_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>
                      Quantidade de créditos
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={inputBaseClass}
                        value={creditsInput}
                        onBlur={field.onBlur}
                        onKeyDown={(event) => {
                          if (
                            [
                              "e",
                              "E",
                              "+",
                              "-",
                              ".",
                              ",",
                            ].includes(event.key)
                          ) {
                            event.preventDefault();
                          }
                        }}
                        onChange={(event) => {
                          const value =
                            event.target.value.replace(
                              /\D/g,
                              ""
                            );

                          setCreditsInput(value);

                          if (value === "") {
                            field.onChange(undefined);
                            return;
                          }

                          field.onChange(Number(value));
                        }}
                      />
                    </FormControl>

                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>
                      Valor do pacote
                    </FormLabel>

                    <FormControl>
                      <div className="relative">
                        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-medium text-slate-500">
                          R$
                        </span>

                        <Input
                          type="text"
                          inputMode="decimal"
                          className={`${inputBaseClass} pl-10`}
                          value={priceInput}
                          onBlur={field.onBlur}
                          onKeyDown={(event) => {
                            if (
                              ["e", "E", "+", "-"].includes(
                                event.key
                              )
                            ) {
                              event.preventDefault();
                            }
                          }}
                          onChange={(event) => {
                            const value =
                              event.target.value;

                            if (
                              !/^\d*[.,]?\d{0,2}$/.test(
                                value
                              )
                            ) {
                              return;
                            }

                            setPriceInput(value);

                            if (value === "") {
                              field.onChange(undefined);
                              return;
                            }

                            const normalizedValue =
                              value.replace(",", ".");

                            const price =
                              Number(normalizedValue);

                            if (!Number.isFinite(price)) {
                              field.onChange(undefined);
                              return;
                            }

                            field.onChange(
                              Math.round(price * 100)
                            );
                          }}
                        />
                      </div>
                    </FormControl>

                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div> */}

            <div className="grid items-start gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="credits_amount"
                render={({ field }) => (
                  <FormItem className="grid grid-rows-[20px_44px_20px] gap-2 space-y-0">
                    <FormLabel className={labelClass}>
                      Quantidade de créditos
                    </FormLabel>

                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Ex: 5"
                        className={`${inputBaseClass} h-11`}
                        value={creditsInput}
                        onBlur={field.onBlur}
                        onKeyDown={(event) => {
                          if (
                            ["e", "E", "+", "-", ".", ","].includes(
                              event.key
                            )
                          ) {
                            event.preventDefault();
                          }
                        }}
                        onChange={(event) => {
                          const value = event.target.value.replace(
                            /\D/g,
                            ""
                          );

                          setCreditsInput(value);

                          if (value === "") {
                            field.onChange(undefined);
                            return;
                          }

                          field.onChange(Number(value));
                        }}
                      />
                    </FormControl>

                    <div className="h-5 overflow-hidden">
                      <FormMessage className="text-[10px] leading-4" />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_cents"
                render={({ field }) => (
                  <FormItem className="grid grid-rows-[20px_44px_20px] gap-2 space-y-0">
                    <FormLabel className={labelClass}>
                      Valor do pacote
                    </FormLabel>

                    <FormControl>
                      <div className="relative h-11">
                        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-medium text-slate-500">
                          R$
                        </span>

                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="Ex: 19,90"
                          className={`${inputBaseClass} h-11 pl-10`}
                          value={priceInput}
                          onBlur={field.onBlur}
                          onKeyDown={(event) => {
                            if (
                              ["e", "E", "+", "-"].includes(event.key)
                            ) {
                              event.preventDefault();
                            }
                          }}
                          onChange={(event) => {
                            const value = event.target.value;

                            if (!/^\d*[.,]?\d{0,2}$/.test(value)) {
                              return;
                            }

                            setPriceInput(value);

                            if (value === "") {
                              field.onChange(undefined);
                              return;
                            }

                            const normalizedValue = value.replace(
                              ",",
                              "."
                            );

                            const price = Number(normalizedValue);

                            if (!Number.isFinite(price)) {
                              field.onChange(undefined);
                              return;
                            }

                            field.onChange(
                              Math.round(price * 100)
                            );
                          }}
                        />
                      </div>
                    </FormControl>

                    <div className="h-5 overflow-hidden">
                      <FormMessage className="text-[10px] leading-4" />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
                className="h-10 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="h-10 rounded-xl font-bold"
                isLoading={isSubmitting}
                loadingText="Atualizando..."
              >
                Atualizar Pacote
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}