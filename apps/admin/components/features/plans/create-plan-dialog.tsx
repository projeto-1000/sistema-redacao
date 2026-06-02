'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreatePlanFormValues, CreatePlanFormInput, createPlanSchema } from "@repo/validators";
import { createPlan } from "@/app/actions/plans";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Button } from "@repo/ui/components/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function CreatePlanDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<CreatePlanFormInput>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      is_active: true,
      price: "" as unknown as number,
      credits_included: 4,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (data: CreatePlanFormInput) => {
    const result = await createPlan(data as CreatePlanFormValues);

    if (result.success) {
      form.reset();
      setOpen(false);
      toast.success("Plano criado com sucesso!")
    } else {
      toast.error("Erro ao salvar plano", { description: 'Tente novamente em instantes.' })
    }
  };

  const inputBaseClass = "w-full rounded-xl px-4 py-2.5 text-sm text-slate-700 transition-all min-h-11";
  const labelClass = "text-sm font-bold text-slate-600";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl font-bold h-10 w-full sm:w-fit">
          <Plus className="size-4 mr-2" />
          Adicionar Novo Plano
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] p-6 rounded-3xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-black">
            Cadastrar Novo Plano
          </DialogTitle>
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
                    <Input placeholder="Ex: Plano Elite Enem" className={inputBaseClass} {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billing_cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Tipo de Plano</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className={inputBaseClass}>
                          <SelectValue placeholder="Selecione a recorrência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="lifetime">Vitalício</SelectItem>
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
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          className={`${inputBaseClass} pl-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                          onKeyDown={(e) => {
                            if (['e', 'E', '+', '-'].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          {...field}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val.includes('.')) {
                              const parts = val.split('.');
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
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Status Inicial</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "true")}
                      defaultValue={field.value ? "true" : "false"}
                    >
                      <FormControl>
                        <SelectTrigger className={inputBaseClass}>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

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
                        className={`${inputBaseClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
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
                      className={`${inputBaseClass} resize-none min-h-20`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="rounded-xl h-10 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-6"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="rounded-xl h-10 font-bold"
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