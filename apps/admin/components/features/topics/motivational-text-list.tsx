"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, ImagePlus, X } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import type { CreateTopicSchema } from "@repo/validators";

export function MotivationalTextList() {
  const { control } = useFormContext<CreateTopicSchema>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "motivationalTexts",
  });

  return (
    <div className="ml-0 space-y-8 md:ml-4">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="relative rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-amber-400 text-sm font-black shadow-sm">
                {String(index + 1).padStart(2, "0")}
              </div>
              <span className="text-[12px] font-bold tracking-widest text-slate-700 uppercase">
                Texto Motivador
              </span>
            </div>

            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => remove(index)}
              >
                <Trash2 className="size-5" />
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <FormField
                  control={control}
                  name={`motivationalTexts.${index}.bodyText`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-bold tracking-widest uppercase">
                        Conteúdo do Texto
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Insira aqui o conteúdo integral do texto de apoio..."
                          className="h-44 resize-none rounded-xl p-4 leading-relaxed"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={control}
                  name={`motivationalTexts.${index}.imageUrl`}
                  render={({ field: { value, onChange } }) => {
                    const fileValue = value as unknown as File | string | undefined;
                    const previewUrl =
                      fileValue instanceof File ? URL.createObjectURL(fileValue) : fileValue;

                    return (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold tracking-widest uppercase">
                          Imagem
                        </FormLabel>
                        <FormControl>
                          <div className="hover:border-primary group relative flex h-44 w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all">
                            {previewUrl ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={previewUrl as string}
                                  alt="Preview"
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="rounded-full font-bold"
                                    onClick={() => onChange(undefined)}
                                  >
                                    <X className="mr-1 size-4" /> Remover
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <input
                                  type="file"
                                  accept="image/png, image/jpeg, image/webp"
                                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onChange(file);
                                  }}
                                />
                                <ImagePlus className="mb-2 size-8 text-slate-400 transition-colors group-hover:text-blue-500" />
                                <span className="text-[12px] font-bold text-slate-500 transition-colors group-hover:text-blue-600">
                                  Clique ou arraste a imagem
                                </span>
                                <span className="mt-1 text-[11px] text-slate-400">
                                  PNG ou JPG (Máx 5MB)
                                </span>
                              </>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            </div>

            <div className="w-full">
              <FormField
                control={control}
                name={`motivationalTexts.${index}.sourceReference`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold tracking-widest uppercase">
                      Fonte / Referência
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: IBGE, 2023 / G1 Notícias"
                        className="h-12 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        onClick={() => append({ sourceReference: "", bodyText: "", imageUrl: undefined })}
        variant="ghost"
        className="h-14 w-full rounded-2xl border-2 border-dashed border-blue-200 text-[16px] font-bold text-blue-600 transition-all hover:border-blue-400"
      >
        <Plus className="size-5" /> Adicionar outro texto motivador
      </Button>
    </div>
  );
}
