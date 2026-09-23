"use server";

import { createClient } from "@/lib/server";
import { PaymentAccount } from "@/types";
import { accountFormSchema, type AccountFormValues } from "@repo/validators";
import { revalidatePath } from "next/cache";

function sanitizeAccount(values: AccountFormValues) {
  const data = accountFormSchema.parse(values);
  const payload = {
    type: data.type,
    owner_name: data.ownerName,
    owner_document: data.ownerDocument.replace(/\D/g, ""),
    pix_type: data.type === "pix" ? data.pixType : null,
    pix_key: data.type === "pix"
      ? (["cpf", "cnpj", "phone"].includes(data.pixType) ? data.pixKey.replace(/\D/g, "") : data.pixKey)
      : null,
    bank_name: data.type === "bank_account" ? data.bankName : null,
    account_variant: data.type === "bank_account" ? data.accountVariant : null,
    agency: data.type === "bank_account" ? data.agency : null,
    account_number: data.type === "bank_account" ? data.accountNumber : null,
  };

  return { data, payload };
}

export async function getPaymentAccounts(teacherId: string): Promise<PaymentAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_payment_accounts")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar contas:", error);
    return [];
  }
  return data as PaymentAccount[];
}

export async function createPaymentAccount(teacherId: string, data: AccountFormValues) {
  const supabase = await createClient();

  try {
    const { data: parsed, payload } = sanitizeAccount(data);
    const { count } = await supabase
      .from("teacher_payment_accounts")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", teacherId);

    const { data: account, error } = await supabase
      .from("teacher_payment_accounts")
      .insert({ ...payload, teacher_id: teacherId, is_default: false })
      .select("id")
      .single();
    if (error) throw error;

    if (parsed.isDefault || count === 0) {
      const { error: defaultError } = await supabase.rpc("set_teacher_default_payment_account", { p_account_id: account.id });
      if (defaultError) {
        await supabase.from("teacher_payment_accounts").delete().eq("id", account.id);
        throw defaultError;
      }
    }

    revalidatePath(`/professores/${teacherId}/pagamentos`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar conta de pagamento:", error);
    return { success: false, error: "Falha ao salvar a conta." };
  }
}

export async function updatePaymentAccount(
  accountId: string,
  teacherId: string,
  data: AccountFormValues
) {
  const supabase = await createClient();

  try {
    const { data: parsed, payload } = sanitizeAccount(data);

    const { error } = await supabase
      .from("teacher_payment_accounts")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", accountId)
      .eq("teacher_id", teacherId);
    if (error) throw error;

    if (parsed.isDefault) {
      const { error: defaultError } = await supabase.rpc("set_teacher_default_payment_account", { p_account_id: accountId });
      if (defaultError) throw defaultError;
    }

    revalidatePath(`/professores/${teacherId}/pagamentos`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao atualizar a conta." };
  }
}

export async function deletePaymentAccount(accountId: string, teacherId: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.rpc("delete_teacher_payment_account", { p_account_id: accountId });
    if (error) throw error;

    revalidatePath(`/professores/${teacherId}/pagamentos`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao excluir a conta." };
  }
}

export async function setDefaultPaymentAccount(accountId: string, teacherId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("set_teacher_default_payment_account", { p_account_id: accountId });
    if (error) throw error;

    revalidatePath(`/professores/${teacherId}/pagamentos`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao definir conta principal:", error);
    return { success: false, error: "Não foi possível definir a conta principal." };
  }
}
