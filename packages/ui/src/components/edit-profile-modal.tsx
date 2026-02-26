'use client'

import { useState, useRef } from "react";
import { User, Camera, Loader2 } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";

interface UserData {
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  initialData: UserData;
  onSave: (payload: { name?: string; avatarFile?: File }) => Promise<void>;
}

export function EditProfileModal({ isOpen, onClose, initialData, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(initialData.name);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      setAvatarFile(file);
    }
  };

  const handleSubmit = async () => {
    const nameChanged = name !== initialData.name;
    const fileChanged = !!avatarFile;

    if (!nameChanged && !fileChanged) {
      onClose(false);
      return;
    }

    setIsLoading(true);

    try {
      const payload: { name?: string; avatarFile?: File } = {};
      if (nameChanged) payload.name = name;
      if (fileChanged) payload.avatarFile = avatarFile!;

      await onSave(payload);
      onClose(false);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-4xl p-8 bg-white border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-center text-slate-900">
            Editar Informações
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500 font-medium">
            Faça alterações no seu perfil aqui. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 mt-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="size-32 rounded-full bg-slate-50 border-4 border-[#FFF9E6] flex items-center justify-center overflow-hidden ring-4 ring-transparent hover:ring-[#FFF9E6] transition-all">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="size-12 text-slate-300" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 p-2.5 bg-slate-900 text-white rounded-full border-4 border-white shadow-md">
              <Camera className="size-4" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="w-full space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">Nome Completo</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border-slate-200 focus:border-[#EBC84C] focus:ring-[#EBC84C]/20 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-1.5">E-mail (Não editável)</label>
              <Input
                value={initialData.email}
                disabled
                className="h-12 rounded-xl bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-100 font-medium"
              />
            </div>
          </div>

          <div className="flex gap-3 w-full mt-4">
            <Button
              variant="outline"
              onClick={() => onClose(false)}
              className="flex-1 h-12 rounded-full font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 h-12 rounded-full font-bold shadow-lg shadow-yellow-500/10"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin size-5" />
                  Salvando
                </div>
              ) : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}