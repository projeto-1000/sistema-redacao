"use server";

import { createClient } from "@/lib/server";
import type { GradedEssayListItem, TeacherPaymentAccount, TeacherPaymentHistoryItem, TeacherPaymentMetrics } from "@repo/types";
import { accountFormSchema, type AccountFormValues } from "@repo/validators";
import { revalidatePath } from "next/cache";

const RECEIPT_URL_TTL_SECONDS = 60 * 60;

async function getAuthenticatedTeacher() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Usuário não autenticado.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "TEACHER") throw new Error("Acesso permitido apenas para professores.");

  return { supabase, teacherId: user.id };
}

async function getReceiptAccessUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  receiptPath: string | null,
) {
  if (!receiptPath) return null;
  const { data, error } = await supabase.storage.from("receipts").createSignedUrl(receiptPath, RECEIPT_URL_TTL_SECONDS);
  return error ? null : data.signedUrl;
}

export async function getTeacherPaymentDashboard(month: string, page = 1, limit = 10): Promise<{
  teacherId: string;
  metrics: TeacherPaymentMetrics;
  accounts: TeacherPaymentAccount[];
  essays: GradedEssayListItem[];
  payments: TeacherPaymentHistoryItem[];
  totalPages: number;
}> {
  const { supabase, teacherId } = await getAuthenticatedTeacher();
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const start = `${month}-01T00:00:00.000-03:00`;
  const end = `${month}-${String(daysInMonth).padStart(2, "0")}T23:59:59.999-03:00`;
  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  const [essaysResult, paymentResult, rateResult, accountsResult, historyResult] = await Promise.all([
    supabase
      .from("essays_with_delivery")
      .select("id, title, correction_date, total_score, student_name, student_avatar, is_on_late")
      .eq("teacher_id", teacherId)
      .eq("status", "corrected")
      .gte("correction_date", start)
      .lte("correction_date", end),
    supabase
      .from("teacher_payments")
      .select("status, receipt_url, total_amount, essays_count, unit_value")
      .eq("teacher_id", teacherId)
      .eq("billing_month", start.slice(0, 10))
      .maybeSingle(),
    supabase.rpc("resolve_teacher_correction_rate", {
      p_teacher_id: teacherId,
      p_billing_month: start.slice(0, 10),
    }),
    supabase
      .from("teacher_payment_accounts")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("teacher_payments")
      .select("id, billing_month, essays_count, unit_value, total_amount, status, receipt_url, processed_at", { count: "exact" })
      .eq("teacher_id", teacherId)
      .order("billing_month", { ascending: false })
      .range(rangeStart, rangeEnd),
  ]);

  if (essaysResult.error || paymentResult.error || rateResult.error || accountsResult.error || historyResult.error) {
    console.error("Erro ao carregar painel de pagamentos do professor:", {
      essays: essaysResult.error,
      payment: paymentResult.error,
      rate: rateResult.error,
      accounts: accountsResult.error,
      history: historyResult.error,
    });
    throw new Error("Não foi possível carregar os pagamentos.");
  }

  const totalEssays = essaysResult.data.length;
  const delayed = essaysResult.data.filter((essay) => essay.is_on_late).length;
  const payment = paymentResult.data;
  const valuePerCorrection = payment ? Number(payment.unit_value) : Number(rateResult.data);
  const payments = await Promise.all(
    historyResult.data.map(async (item) => ({
      ...item,
      unit_value: Number(item.unit_value),
      total_amount: Number(item.total_amount),
      receipt_url: await getReceiptAccessUrl(supabase, item.receipt_url),
    })),
  );

  return {
    teacherId,
    metrics: {
      totalEssays: payment?.essays_count ?? totalEssays,
      onTime: totalEssays - delayed,
      delayed,
      valuePerCorrection,
      dailyAverage: totalEssays > 0 ? Number((totalEssays / daysInMonth).toFixed(1)) : 0,
      totalAmount: payment ? Number(payment.total_amount) : totalEssays * valuePerCorrection,
      status: payment?.status ?? null,
      receiptUrl: await getReceiptAccessUrl(supabase, payment?.receipt_url ?? null) ?? undefined,
    },
    accounts: accountsResult.data as TeacherPaymentAccount[],
    essays: essaysResult.data.map((essay) => ({
      id: essay.id,
      title: essay.title,
      correction_date: essay.correction_date,
      total_score: essay.total_score,
      student_name: essay.student_name ?? "Aluno",
      avatar_url: essay.student_avatar ?? "",
    })),
    payments: payments as TeacherPaymentHistoryItem[],
    totalPages: historyResult.count ? Math.ceil(historyResult.count / limit) : 0,
  };
}

function sanitizeAccount(values: AccountFormValues) {
  const data = accountFormSchema.parse(values);
  const common = {
    type: data.type,
    owner_name: data.ownerName,
    owner_document: data.ownerDocument.replace(/\D/g, ""),
    pix_type: data.type === "pix" ? data.pixType : null,
    pix_key: data.type === "pix" ? (["cpf", "cnpj", "phone"].includes(data.pixType) ? data.pixKey.replace(/\D/g, "") : data.pixKey) : null,
    bank_name: data.type === "bank_account" ? data.bankName : null,
    account_variant: data.type === "bank_account" ? data.accountVariant : null,
    agency: data.type === "bank_account" ? data.agency.replace(/[^a-zA-Z0-9]/g, "") : null,
    account_number: data.type === "bank_account" ? data.accountNumber.replace(/[^a-zA-Z0-9]/g, "") : null,
  };
  return { data, payload: common };
}

export async function createOwnPaymentAccount(values: AccountFormValues) {
  try {
    const { supabase, teacherId } = await getAuthenticatedTeacher();
    const { data, payload } = sanitizeAccount(values);
    const { count } = await supabase.from("teacher_payment_accounts").select("id", { count: "exact", head: true }).eq("teacher_id", teacherId);
    const { data: account, error } = await supabase
      .from("teacher_payment_accounts")
      .insert({ ...payload, teacher_id: teacherId, is_default: false })
      .select("id")
      .single();
    if (error) throw error;

    if (data.isDefault || count === 0) {
      const { error: defaultError } = await supabase.rpc("set_teacher_default_payment_account", { p_account_id: account.id });
      if (defaultError) {
        await supabase.from("teacher_payment_accounts").delete().eq("id", account.id).eq("teacher_id", teacherId);
        throw defaultError;
      }
    }

    revalidatePath("/pagamentos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar conta de pagamento:", error);
    return { success: false, error: "Não foi possível cadastrar a conta." };
  }
}

export async function updateOwnPaymentAccount(accountId: string, values: AccountFormValues) {
  try {
    const { supabase, teacherId } = await getAuthenticatedTeacher();
    const { data, payload } = sanitizeAccount(values);
    const { error } = await supabase.from("teacher_payment_accounts").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", accountId).eq("teacher_id", teacherId);
    if (error) throw error;

    if (data.isDefault) {
      const { error: defaultError } = await supabase.rpc("set_teacher_default_payment_account", { p_account_id: accountId });
      if (defaultError) throw defaultError;
    }

    revalidatePath("/pagamentos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar conta de pagamento:", error);
    return { success: false, error: "Não foi possível atualizar a conta." };
  }
}

export async function setOwnDefaultPaymentAccount(accountId: string) {
  try {
    const { supabase } = await getAuthenticatedTeacher();
    const { error } = await supabase.rpc("set_teacher_default_payment_account", { p_account_id: accountId });
    if (error) throw error;
    revalidatePath("/pagamentos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao definir conta principal:", error);
    return { success: false, error: "Não foi possível definir a conta principal." };
  }
}

export async function deleteOwnPaymentAccount(accountId: string) {
  try {
    const { supabase } = await getAuthenticatedTeacher();
    const { error } = await supabase.rpc("delete_teacher_payment_account", { p_account_id: accountId });
    if (error) throw error;
    revalidatePath("/pagamentos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir conta de pagamento:", error);
    return { success: false, error: "Não foi possível excluir a conta." };
  }
}
