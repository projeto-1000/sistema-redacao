'use client'

import { useRef, ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Camera, Save, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import AvatarEditor, { useAvatarEditor } from "react-avatar-editor";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Avatar } from "@repo/ui/components/avatar";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@repo/ui/components/alert-dialog";
import { toast } from "sonner";
import { ActionResponse } from "./profile-view";
import { Skeleton } from "../../skeleton";
import { UserData } from "@repo/types";

interface ProfileFormProps {
  initialData: UserData;
  onSave: (data: { name: string }) => Promise<ActionResponse | void>;
  onUpload: (formData: FormData) => Promise<ActionResponse | void>;
  onDirtyStateChange?: (isDirty: boolean) => void;
}

export function ProfileForm({ initialData, onSave, onUpload, onDirtyStateChange }: ProfileFormProps) {
  const editor = useAvatarEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(initialData.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, reset, formState: { isDirty, isSubmitting } } = useForm<{ name: string }>({
    defaultValues: { name: initialData.name },
  });

  useEffect(() => {
    onDirtyStateChange?.(isDirty);
  }, [isDirty, onDirtyStateChange]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Limite de 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setScale(1);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveAvatar = async () => {
    const canvas = editor.getImageScaledToCanvas();
    if (!canvas) return;

    setIsUploading(true);
    setIsCropModalOpen(false);

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );

      if (!blob) throw new Error("Falha ao gerar a imagem");

      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");

      const response = await onUpload(formData);

      if (response && !response.success) {
        toast.error(response.error || "Erro ao salvar a imagem.");
      } else {
        toast.success("Foto de perfil atualizada!");
        if (response?.avatarUrl) {
          setCurrentAvatarUrl(response.avatarUrl);
        }
      }
    } catch {
      toast.error("Erro ao processar o upload.");
    } finally {
      setIsUploading(false);
      setImageSrc(null);
    }
  };

  const onSubmit = async (data: { name: string }) => {
    try {
      const response = await onSave(data);
      if (response && !response.success) return toast.error(response.error);
      reset({ name: data.name });
      toast.success("Perfil salvo!");
    } catch {
      toast.error("Erro fatal ao salvar.");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-12 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            {isUploading ? (
              <Skeleton
                className="size-28 md:size-40 rounded-full border-4 border-slate-50 shadow-xl bg-slate-400"
              />
            ) : (
              <Avatar
                src={currentAvatarUrl}
                name={initialData.name}
                className="size-28 md:size-40 border-4 border-slate-50 shadow-xl md:text-5xl"
              />
            )}

            <button
              type="button"
              onClick={() => !isUploading && fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-1 right-1 p-3 bg-slate-900 text-white rounded-full border-4 border-white hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Nome Completo</label>
            <Input {...register("name", { required: true })} className="h-12 bg-slate-50 border-slate-200 rounded-xl font-medium text-slate-700" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">E-mail</label>
            <Input value={initialData.email} disabled className="h-12 bg-slate-100 border-slate-100 text-slate-400 rounded-xl" />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting || !isDirty} className="px-8 h-12 rounded-2xl font-bold">
            <Save className="size-4 mr-2" /> Salvar Alterações
          </Button>
        </div>
      </form>

      <AlertDialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <AlertDialogContent className="rounded-3xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center font-bold">Ajustar Foto de Perfil</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="flex flex-col items-center justify-center my-4">
            {imageSrc && (
              <AvatarEditor
                ref={editor.ref}
                image={imageSrc}
                width={250}
                height={250}
                border={20}
                borderRadius={125}
                color={[255, 255, 255, 0.8]}
                scale={scale}
                rotate={0}
                style={{ borderRadius: "12px", backgroundColor: "#f1f5f9" }}
              />
            )}
          </div>

          <div className="flex items-center gap-4 px-4 w-full">
            <ZoomOut className="size-5 text-slate-400" />
            <input
              type="range"
              value={scale}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <ZoomIn className="size-5 text-slate-400" />
          </div>

          <AlertDialogFooter className="mt-6 flex gap-2">
            <AlertDialogCancel className="h-12 flex-1 rounded-xl font-bold m-0" onClick={() => setImageSrc(null)}>
              Cancelar
            </AlertDialogCancel>
            <Button onClick={handleSaveAvatar} className="h-12 flex-1 rounded-xl font-bold shadow-lg">
              Salvar Foto
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}