import { SetPasswordForm } from "@/components/set-password-form";


export default function NovaSenhaPage() {
  return (
    <div className="bg-slate-100 min-h-dvh flex items-center flex-col justify-center p-4">


      <SetPasswordForm />

      <footer className="mt-8 text-center text-sm text-zinc-500">
        Ambiente seguro e criptografado.
      </footer>
    </div>
  )
}