'use client'

import { useRef, ChangeEvent, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Camera, Loader2, Save } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Avatar } from "@repo/ui/components/avatar";
import { toast } from "sonner";

interface UserData {
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface ProfileFormProps {
  initialData: UserData;
  onSave: (data: { name: string }) => Promise<void>;
  onUpload: (formData: FormData) => Promise<void>;
  onDirtyStateChange?: (isDirty: boolean) => void;
}

type FormDataFields = {
  name: string;
};

export function ProfileForm({ initialData, onSave, onUpload, onDirtyStateChange }: ProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting }
  } = useForm<FormDataFields>({
    defaultValues: {
      name: initialData.name,
    },
  });

  useEffect(() => {
    onDirtyStateChange?.(isDirty);
  }, [isDirty, onDirtyStateChange]);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await onUpload(formData);
      toast.success("Foto atualizada!");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Erro no upload.");
    }
  };

  const onSubmit = async (data: FormDataFields) => {
    try {
      await onSave(data);
      reset({ name: data.name });
      toast.success("Perfil salvo!");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Erro ao salvar.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <Avatar
            src={initialData.avatarUrl}
            name={initialData.name}
            className="size-28 md:size-40 border-4 border-slate-50 shadow-xl md:text-5xl"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 p-3 bg-slate-900 text-white rounded-full border-4 border-white hover:scale-110 transition-transform"
          >
            <Camera className="size-4" />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Nome Completo</label>
          <Input
            {...register("name", { required: true })}
            className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-medium text-slate-900"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">E-mail</label>
          <Input value={initialData.email} disabled className="h-12 bg-slate-100 border-slate-100 text-slate-400 rounded-xl" />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="px-8 h-12 rounded-2xl gap-2 font-bold shadow-lg shadow-yellow-500/20"
          isLoading={isSubmitting}
          loadingText="Salvando..."
        >
          <Save className="size-4" />
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
}