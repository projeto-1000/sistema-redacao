"use client";

import { Info } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { THEMATIC_AXES, type CreateTopicSchema, type CreateTopicInput } from "@repo/validators";
import { useFormContext, useWatch } from "react-hook-form";

export function TopicInfoForm() {
  const { control } = useFormContext<CreateTopicInput, unknown, CreateTopicSchema>();

  const sourceType = useWatch({
    control,
    name: "sourceType",
  });

  const currentYear = new Date().getFullYear();
  const last20Years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-primary mb-6 flex items-center gap-2 text-[12px] font-bold tracking-widest uppercase">
        <Info className="size-4" /> Informações da Proposta
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[11px] font-bold tracking-widest uppercase">
                  Título da Proposta
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: O impacto do descarte de resíduos..."
                    className="min-h-12 rounded-xl"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="axis"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-bold tracking-widest uppercase">
                Eixo Temático
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="min-h-12 min-w-full rounded-xl">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {THEMATIC_AXES.map((axis) => (
                    <SelectItem key={axis} value={axis}>
                      {axis}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <div className="flex-1">
            <FormField
              control={control}
              name="sourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-bold tracking-widest uppercase">
                    Fonte
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="min-h-12 min-w-full rounded-xl">
                        <SelectValue placeholder="Fonte" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AUTORAL">Autoral</SelectItem>
                      <SelectItem value="ENEM">ENEM</SelectItem>
                      <SelectItem value="ENEM PPL/Reaplicação">ENEM PPL/Reaplicação</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {sourceType !== "AUTORAL" && (
            <div className="w-24">
              <FormField
                control={control}
                name="sourceYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold tracking-widest text-transparent uppercase selection:text-transparent">
                      Ano
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger className="min-h-12 min-w-full rounded-xl">
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {last20Years.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
