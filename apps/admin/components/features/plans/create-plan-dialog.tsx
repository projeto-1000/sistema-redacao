"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreatePlanFormInput, createPlanSchema, CreatePlanFormValues } from "@repo/validators";
import { createPlan } from "@/app/actions/plans";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function CreatePlanDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<CreatePlanFormInput>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      features: [],
      is_active: true,
      is_public: true,
      is_recommended: false,
      discount_percentage: null,
      sort_order: 0,
      price: "" as unknown as number,
      credits_included: 4,
      interval: "month",
      interval_count: 1,
      credits_expiration_days: 30,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (data: CreatePlanFormInput) => {
    const result = await createPlan(data as CreatePlanFormValues);

    if (result.success) {
      form.reset();
      setOpen(false);
      toast.success("Plano criado com sucesso!");
    } else {
      toast.error("Erro ao salvar plano", {
        description: result.error || "Tente novamente em instantes.",
      });
    }
  };

  const inputBaseClass =
    "w-full rounded-xl px-4 py-2.5 text-sm text-slate-700 transition-all min-h-11";
  const labelClass = "text-sm font-bold text-slate-600";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 w-full rounded-xl font-bold sm:w-fit">
          <Plus className="mr-2 size-4" />
          Adicionar Novo Plano
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:max-w-[600px]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black">Cadastrar Novo Plano</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Nome do Plano</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Plano Elite Enem"
                      className={inputBaseClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="interval_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Tipo de Plano / Recorrência</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className={inputBaseClass}>
                          <SelectValue placeholder="Selecione a recorrência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Mensal</SelectItem>
                        <SelectItem value="3">Trimestral</SelectItem>
                        <SelectItem value="6">Semestral</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Valor do Plano</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm font-medium text-slate-500">
                          R$
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          className={`${inputBaseClass} [appearance:textfield] pl-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                          onKeyDown={(e) => {
                            if (["e", "E", "+", "-"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          {...field}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val.includes(".")) {
                              const parts = val.split(".");
                              if (parts[1] && parts[1].length > 2) {
                                val = `${parts[0]}.${parts[1].substring(0, 2)}`;
                              }
                            }
                            field.onChange(val);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="credits_included"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Redações Inclusas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 4"
                        className={`${inputBaseClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                        onKeyDown={(e) => {
                          if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credits_expiration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Validade (Dias)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 30"
                        className={`${inputBaseClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Descrição do Plano</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os benefícios e detalhes deste plano..."
                      className={`${inputBaseClass} min-h-20 resize-none`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Funcionalidades</FormLabel>
                  <FormControl>
                    <Textarea
                      value={(field.value ?? []).join("\n")}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            .split("\n")
                            .map((feature) => feature.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="Informe uma funcionalidade por linha"
                      className={`${inputBaseClass} min-h-32 resize-y`}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Desconto exibido (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === "" ? null : Number(event.target.value)
                          )
                        }
                        placeholder="Ex: 15"
                        className={inputBaseClass}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Ordem de exibição</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} className={inputBaseClass} {...field} />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className={labelClass}>Exibir no catálogo</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_recommended"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className={labelClass}>Destacar como recomendado</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="h-10 rounded-xl border-slate-200 px-6 font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="h-10 rounded-xl font-bold"
                isLoading={isSubmitting}
                loadingText="Salvando..."
              >
                Salvar Plano
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
