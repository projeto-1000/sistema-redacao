import { SetPasswordForm } from "@/components/set-password-form";
import { ShieldCheck } from "lucide-react";


export default function NovaSenhaPage() {
  return (
    <div className="bg-gradient-soft min-h-dvh flex items-center flex-col justify-center p-4">


      <SetPasswordForm />

      <footer className="mt-8 text-center text-[12px] text-slate-500 flex items-center gap-2 font-bold uppercase tracking-wider">
        <ShieldCheck className="text-emerald-500 size-4" />Ambiente seguro e criptografado.
      </footer>
    </div>
  )
}