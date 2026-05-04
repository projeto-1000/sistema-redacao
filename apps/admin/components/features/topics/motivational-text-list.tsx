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
    <div className="space-y-8 ml-0 md:ml-4">
      {fields.map((field, index) => (
        <div key={field.id} className="bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-sm relative">

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="size-8 bg-amber-400 rounded-full flex items-center justify-center font-black text-sm shadow-sm">
                {String(index + 1).padStart(2, '0')}
              </div>
              <span className="font-bold text-slate-700 uppercase text-[12px] tracking-widest">
                Texto Motivador
              </span>
            </div>

            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                onClick={() => remove(index)}
              >
                <Trash2 className="size-5" />
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="md:col-span-2">
                <FormField
                  control={control}
                  name={`motivationalTexts.${index}.bodyText`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px] font-bold uppercase tracking-widest">
                        Conteúdo do Texto
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Insira aqui o conteúdo integral do texto de apoio..."
                          className="h-44 p-4 rounded-xl resize-none leading-relaxed focus-visible:ring-secondary focus-visible:border-secondary focus-visible:ring-1"
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
                    const previewUrl = fileValue instanceof File ? URL.createObjectURL(fileValue) : fileValue;

                    return (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-widest">
                          Imagem
                        </FormLabel>
                        <FormControl>
                          <div
                            className="relative w-full h-44 rounded-xl border-2 border-dashed border-slate-200 hover:border-secondary bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition-all group">
                            {previewUrl ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl as string} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="rounded-full font-bold"
                                    onClick={() => onChange(undefined)}
                                  >
                                    <X className="size-4 mr-1" /> Remover
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <input
                                  type="file"
                                  accept="image/png, image/jpeg, image/webp"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onChange(file);
                                  }}
                                />
                                <ImagePlus className="size-8 text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />
                                <span className="text-[12px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                                  Clique ou arraste a imagem
                                </span>
                                <span className="text-[11px] text-slate-400 mt-1">PNG ou JPG (Máx 5MB)</span>
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
                    <FormLabel className="text-[11px] font-bold uppercase tracking-widest">Fonte / Referência</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: IBGE, 2023 / G1 Notícias" className="h-12 rounded-xl focus-visible:ring-secondary focus-visible:border-secondary focus-visible:ring-1" {...field} />
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
        variant='ghost'
        className="w-full h-14 rounded-2xl border-2 border-dashed border-blue-200 text-blue-600 hover:border-blue-400 font-bold text-[16px] transition-all"
      >
        <Plus className="size-5" /> Adicionar outro texto motivador
      </Button>
    </div>
  );
}