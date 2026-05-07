'use client'

import { setNewPassword } from '@/app/actions/profile'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@repo/ui/components/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@repo/ui/components/card'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form'
import { Input } from '@repo/ui/components/input'
import { getErrorMessage } from '@repo/utils'
import { type SetPasswordSchema, setPasswordSchema } from '@repo/validators'
import { EyeOff, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export function SetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(setPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: '',
      confirmPassword: '',
      terms: false,
    }
  })

  const { isValid, isSubmitting } = form.formState;


  const handleSubmit = async (values: SetPasswordSchema) => {
    try {
      await setNewPassword(values);

      router.push("/inicio");
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);

      toast.error(title, {
        description: description,
        duration: 5000
      });

    }
  };

  return (
    <Card className="w-full max-w-[500px] bg-white rounded-xl shadow-xl border border-slate-100 px-5 py-6 md:py-8 md:px-6">
      <CardHeader className="text-center gap-2">
        <CardTitle className="text-2xl font-bold leading-tight">Defina sua senha</CardTitle>
        <CardDescription className="text-slate-500 text-sm sm:text-base md:text-[16px]">
          Crie uma senha segura para acessar a área de aluno.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 uppercase tracking-wider text-[13px]">Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="w-full rounded-2xl h-12 p-3.5 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-1"
                        type={showPassword ? "text" : "password"}
                        placeholder="Crie uma senha segura"
                        {...field}
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 uppercase tracking-wider text-[13px]">Confirmar Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="w-full rounded-2xl h-12 p-3.5 focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-1"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
                        {...field}
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start my-6">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </FormControl>
                  <div className="space-y-2 leading-none">
                    <FormLabel className="text-slate-600 font-medium leading-relaxed">
                      Eu concordo com os Termos de Uso e Políticas de Privacidade da plataforma.
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full font-medium h-12 rounded-2xl text-[16px]"
              disabled={isSubmitting || !isValid}
              isLoading={isSubmitting}
              loadingText='Salvando...'
            >
              Salvar e Acessar Plataforma
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}