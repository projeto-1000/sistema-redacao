'use client'

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { toast } from "sonner";

interface PasswordFormProps {
  onUpdate: (password: string) => Promise<void>;
}

export function PasswordForm({ onUpdate }: PasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(password);
      toast.success("Senha atualizada com sucesso!");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Erro ao atualizar a senha.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-md mx-auto space-y-6 py-12 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
          <Lock className="size-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold">Alterar sua senha</h3>
        <p className="text-sm text-slate-500">Escolha uma senha forte para proteger sua conta.</p>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700">Nova Senha</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border-[#e8e4ce] h-12 p-3.5 pr-12 focus:ring-1 focus:ring-primary"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-slate-700">Confirmar Nova Senha</label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border-[#e8e4ce] h-12 p-3.5 pr-12 focus:ring-1 focus:ring-primary"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <Button
          onClick={handleUpdatePassword}
          disabled={isSaving || !password || !confirmPassword}
          className="w-full h-12 rounded-xl font-bold mt-2"
          isLoading={isSaving}
          loadingText="Salvando..."
        >
          Atualizar senha
        </Button>
      </div>
    </div>
  );
}