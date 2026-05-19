"use server";

import { createClient } from "@/lib/server";
import { PaymentAccount } from "@/types";
import { AccountFormValues } from "@repo/validators";
import { revalidatePath } from "next/cache";

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
    if (data.isDefault) {
      await supabase
        .from("teacher_payment_accounts")
        .update({ is_default: false })
        .eq("teacher_id", teacherId);
    }

    const payload = {
      teacher_id: teacherId,
      type: data.type,
      owner_name: data.ownerName,
      owner_document: data.ownerDocument,
      is_default: data.isDefault,
      pix_type: data.type === "pix" ? data.pixType : null,
      pix_key: data.type === "pix" ? data.pixKey : null,
      bank_name: data.type === "bank_account" ? data.bankName : null,
      account_variant: data.type === "bank_account" ? data.accountVariant : null,
      agency: data.type === "bank_account" ? data.agency : null,
      account_number: data.type === "bank_account" ? data.accountNumber : null,
    };

    const { error } = await supabase.from("teacher_payment_accounts").insert(payload);
    if (error) throw error;

    revalidatePath(`/professores/${teacherId}/pagamentos`);
    return { success: true };
  } catch (error) {
    console.log(error);
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
    if (data.isDefault) {
      await supabase
        .from("teacher_payment_accounts")
        .update({ is_default: false })
        .eq("teacher_id", teacherId);
    }

    const payload = {
      type: data.type,
      owner_name: data.ownerName,
      owner_document: data.ownerDocument,
      is_default: data.isDefault,
      pix_type: data.type === "pix" ? data.pixType : null,
      pix_key: data.type === "pix" ? data.pixKey : null,
      bank_name: data.type === "bank_account" ? data.bankName : null,
      account_variant: data.type === "bank_account" ? data.accountVariant : null,
      agency: data.type === "bank_account" ? data.agency : null,
      account_number: data.type === "bank_account" ? data.accountNumber : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("teacher_payment_accounts")
      .update(payload)
      .eq("id", accountId);
    if (error) throw error;

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
    const { error } = await supabase.from("teacher_payment_accounts").delete().eq("id", accountId);
    if (error) throw error;

    revalidatePath(`/professores/${teacherId}/pagamentos`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao excluir a conta." };
  }
}
