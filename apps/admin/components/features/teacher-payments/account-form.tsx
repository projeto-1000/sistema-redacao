"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountFormSchema, type AccountFormValues } from "@repo/validators";
import { Button } from "@repo/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { createPaymentAccount, updatePaymentAccount } from "@/app/actions/payment-accounts";
import { toast } from "sonner";
import { PaymentAccount } from "@/types";
import { formatDocument, maskPixKey } from "@repo/utils";

interface AccountFormProps {
  teacherId: string;
  initialData?: PaymentAccount | null;
  onCancel: () => void;
}

export function AccountForm({ teacherId, initialData, onCancel }: AccountFormProps) {
  const isEditing = !!initialData;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema) as unknown as Resolver<AccountFormValues>,
    mode: "onChange",
    defaultValues: {
      type: initialData?.type || "",
      ownerName: initialData?.owner_name || "",
      ownerDocument: initialData?.owner_document ? formatDocument(initialData.owner_document) : "",
      isDefault: initialData?.is_default || false,
      pixType: initialData?.pix_type || "cpf",
      pixKey: initialData?.pix_key ? maskPixKey(initialData.pix_key, initialData.pix_type || "cpf") : "",
      bankName: initialData?.bank_name || "",
      accountVariant: initialData?.account_variant || "corrente",
      agency: initialData?.agency || "",
      accountNumber: initialData?.account_number || "",
    } as unknown as AccountFormValues,
  });

  const currentType = form.watch("type");
  const currentPixType = form.watch("pixType");

  const getPixPlaceholder = (type: string) => {
    switch (type) {
      case "cpf": return "000.000.000-00";
      case "cnpj": return "00.000.000/0000-00";
      case "phone": return "(00) 00000-0000";
      case "email": return "email@exemplo.com";
      default: return "Digite a chave aleatória";
    }
  };

  const onSubmit = async (data: AccountFormValues) => {
    try {
      const sanitizedData = { ...data };
      sanitizedData.ownerDocument = data.ownerDocument.replace(/\D/g, "");

      if (sanitizedData.type === "pix") {
        if (["cpf", "cnpj", "phone"].includes(sanitizedData.pixType)) {
          sanitizedData.pixKey = sanitizedData.pixKey.replace(/\D/g, "");
        }
      }

      if (sanitizedData.type === "bank_account") {
        sanitizedData.agency = sanitizedData.agency.replace(/[^a-zA-Z0-9]/g, "");
        sanitizedData.accountNumber = sanitizedData.accountNumber.replace(/[^a-zA-Z0-9]/g, "");
      }

      const result = isEditing && initialData
        ? await updatePaymentAccount(initialData.id, teacherId, sanitizedData)
        : await createPaymentAccount(teacherId, sanitizedData);

      if (result.success) {
        toast.success(`Conta ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
        onCancel();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error)
      toast.error("Ocorreu um erro inesperado.");
    }
  };

  return (
    <div className="px-2 space-y-8 animate-in slide-in-from-right-8 fade-in duration-300">

      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => onSubmit(d as unknown as AccountFormValues))} className="space-y-6">

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => form.setValue("type", "pix")}
              className={`h-11 rounded-xl font-medium border-2 transition-all ${currentType === 'pix' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
            >
              Chave PIX
            </button>
            <button
              type="button"
              onClick={() => form.setValue("type", "bank_account")}
              className={`h-11 rounded-xl font-medium border-2 transition-all ${currentType === 'bank_account' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
            >
              Conta Bancária
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {currentType && currentType === 'pix' && (
              <>
                <FormField
                  control={form.control}
                  name="pixType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Tipo de Chave</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="min-h-12 w-full rounded-xl border-slate-200 bg-white focus-visible:border-secondary focus-visible:ring-1 focus-visible:ring-secondary">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="random">Chave Aleatória</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pixKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">
                        Chave PIX
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={getPixPlaceholder(currentPixType)}
                          className="h-12 rounded-xl border-slate-200 focus-visible:border-secondary focus-visible:ring-1 focus-visible:ring-secondary"
                          {...field}
                          onChange={(e) => {
                            const maskedValue = maskPixKey(e.target.value, currentPixType);
                            field.onChange(maskedValue);
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </>
            )}

            {currentType && currentType === 'bank_account' && (
              <>
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Banco</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Nubank, Banco do Brasil..." className="h-12 rounded-xl focus-visible:border-secondary focus-visible:ring-1 focus-visible:ring-secondary border-slate-200" {...field} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountVariant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Tipo de Conta</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white focus-visible:border-secondary focus-visible:ring-1 focus-visible:ring-secondary">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="corrente">Conta Corrente</SelectItem>
                          <SelectItem value="poupanca">Conta Poupança</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Agência (Sem dígito)</FormLabel>
                      <FormControl>
                        <Input placeholder="0000" className="h-12 rounded-xl border-slate-200 focus-visible:border-secondary focus-visible:ring-1 focus-visible:ring-secondary" {...field} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Conta (Com dígito)</FormLabel>
                      <FormControl>
                        <Input placeholder="000000-0" className="h-12 rounded-xl border-slate-200 focus-visible:border-secondary focus-visible:ring-1 focus-visible:ring-secondary" {...field} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </>
            )}

            {currentType && (
              <>
                <div className="md:col-span-2 h-px w-full bg-slate-100" />

                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Nome do Titular</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" className="h-12 rounded-xl border-slate-200 focus-visible:border-secondary focus-visible:ring-1 focus-visible:ring-secondary" {...field} />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerDocument"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">CPF / CNPJ do Titular</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          className="h-12 rounded-xl border-slate-200 focus-visible:border-secondary focus-visible:ring-1 focus-visible:ring-secondary"
                          {...field}
                          onChange={(e) => {
                            const maskDocuemnt = formatDocument(e.target.value)
                            field.onChange(maskDocuemnt)
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-row items-start space-x-2 space-y-0 col-span-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                          className="mt-1 data-[state=checked]:bg-blue-600! data-[state=checked]:border-blue-600!"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                          Definir como conta padrão para recebimentos
                        </FormLabel>
                        <FormDescription className="text-xs font-medium text-slate-500">
                          Os próximos repasses usarão esta conta.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end gap-3 pt-2 col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={form.formState.isSubmitting}
                    className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:hover:bg-slate-200"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting || !form.formState.isValid}
                    className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-sm min-w-40"
                    isLoading={form.formState.isSubmitting}
                    loadingText="Salvando..."
                  >
                    Salvar Conta
                  </Button>
                </div>
              </>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}