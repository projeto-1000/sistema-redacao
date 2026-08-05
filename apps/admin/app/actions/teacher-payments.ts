"use server";

import { createClient } from "@/lib/server";
import { PaymentHistoryItem, PaymentMetrics, TeacherEssayListItem } from "@/types";
import { endOfMonth, getDaysInMonth, parseISO, startOfMonth } from "date-fns";
import { revalidatePath } from "next/cache";
import { PostgrestError } from "@supabase/supabase-js";
import { generateCsv } from "@repo/utils";
interface GetEssaysByPeriodParams {
  teacherId: string;
  start: string;
  end: string;
  page?: number;
  limit?: number;
}

const RECEIPT_URL_TTL_SECONDS = 60 * 60;
const MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024;

async function getReceiptAccessUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  receiptPath: string | null | undefined
) {
  if (!receiptPath) return undefined;

  if (receiptPath.startsWith("http://") || receiptPath.startsWith("https://")) {
    const publicPathMarker = "/storage/v1/object/public/receipts/";
    const markerIndex = receiptPath.indexOf(publicPathMarker);

    if (markerIndex === -1) return undefined;

    const [legacyReceiptPath] = receiptPath.slice(markerIndex + publicPathMarker.length).split("?");

    if (!legacyReceiptPath) return undefined;

    receiptPath = decodeURIComponent(legacyReceiptPath);
  }

  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(receiptPath, RECEIPT_URL_TTL_SECONDS);

  if (error) {
    console.error("Erro ao gerar acesso temporário ao comprovante:", error);
    return undefined;
  }

  return data.signedUrl;
}

export async function getPaymentMetrics(
  teacherId: string,
  month?: string
): Promise<PaymentMetrics & { receiptUrl?: string }> {
  const supabase = await createClient();
  const refDate = month ? parseISO(`${month}-01`) : new Date();

  const start = startOfMonth(refDate).toISOString();
  const end = endOfMonth(refDate).toISOString();

  const essaysQuery = supabase
    .from("essays_with_delivery")
    .select("is_on_late")
    .eq("teacher_id", teacherId)
    .gte("correction_date", start)
    .lte("correction_date", end);

  const paymentQuery = supabase
    .from("teacher_payments")
    .select("status, receipt_url")
    .eq("teacher_id", teacherId)
    .eq("billing_month", start)
    .maybeSingle();

  const [essaysResult, paymentResult] = await Promise.all([essaysQuery, paymentQuery]);

  if (essaysResult.error) {
    console.error("Erro ao calcular métricas no banco: ", essaysResult.error);
    return {
      totalEssays: 0,
      onTime: 0,
      delayed: 0,
      valuePerCorrection: 0,
      dailyAverage: 0,
      totalAmount: 0,
      status: "pending",
    };
  }

  const totalEssays = essaysResult.data.length;
  const delayed = essaysResult.data.filter((essay) => essay.is_on_late).length;
  const onTime = totalEssays - delayed;

  const valuePerCorrection = 10.0;
  const totalAmount = totalEssays * valuePerCorrection;

  const diffDays = getDaysInMonth(refDate);
  const dailyAverage = totalEssays > 0 ? Number((totalEssays / diffDays).toFixed(1)) : 0;

  const dbPayment = paymentResult.data;
  const receiptUrl = await getReceiptAccessUrl(supabase, dbPayment?.receipt_url);

  return {
    totalEssays,
    onTime,
    delayed,
    valuePerCorrection,
    dailyAverage,
    totalAmount,
    status: dbPayment?.status,
    receiptUrl,
  };
}

export async function getEssaysByPeriod({
  teacherId,
  start,
  end,
  page = 1,
  limit = 10,
}: GetEssaysByPeriodParams): Promise<{
  essays: TeacherEssayListItem[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  const query = supabase
    .from("essays_with_delivery")
    .select(
      `id, 
      student_id, 
      title, 
      thematic_axis, 
      status, 
      correction_date,
      total_score, 
      due_date, 
      is_on_late,
      student_name,
      student_email,
      student_avatar
      `,
      { count: "exact" }
    )
    .eq("teacher_id", teacherId)
    .gte("correction_date", start)
    .lte("correction_date", end);

  const { data, count, error } = await query
    .range(rangeStart, rangeEnd)
    .order("correction_date", { ascending: false });

  if (error) {
    console.error("Erro ao buscar redações:", error);
    return { essays: [], totalPages: 0, error };
  }

  return {
    essays: data,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error: error,
  };
}

export async function createTeacherPayment(formData: FormData) {
  const supabase = await createClient();

  const teacherId = formData.get("teacherId") as string;
  const monthStr = formData.get("month") as string;
  const file = formData.get("receipt") as File;
  const essaysCount = Number(formData.get("essaysCount"));
  const unitValue = Number(formData.get("unitValue"));
  const totalAmount = Number(formData.get("totalAmount"));

  if (!file || file.size === 0) {
    throw new Error("O comprovante em PDF é obrigatório.");
  }

  if (file.type !== "application/pdf") {
    throw new Error("O comprovante deve ser um arquivo PDF.");
  }

  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    throw new Error("O comprovante deve ter no máximo 10 MB.");
  }

  try {
    const fileName = `${teacherId}/${monthStr}-${Date.now()}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const billingMonth = `${monthStr}-01T00:00:00.000-03:00`;
    const [yearStr, monthStrPart] = monthStr.split("-");
    const lastDay = new Date(Number(yearStr), Number(monthStrPart), 0).getDate();
    const lastDayStr = String(lastDay).padStart(2, "0");

    const endOfMonthStr = `${monthStr}-${lastDayStr}T23:59:59.999-03:00`;

    const { data: payment, error: paymentError } = await supabase
      .from("teacher_payments")
      .insert({
        teacher_id: teacherId,
        billing_month: billingMonth,
        total_amount: totalAmount,
        essays_count: essaysCount,
        unit_value: unitValue,
        receipt_url: uploadData.path,
        status: "paid",
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      await supabase.storage.from("receipts").remove([uploadData.path]);
      throw paymentError;
    }

    const { error: updateError } = await supabase
      .from("essays")
      .update({ payment_id: payment.id })
      .eq("teacher_id", teacherId)
      .gte("correction_date", billingMonth)
      .lte("correction_date", endOfMonthStr)
      .is("payment_id", null);

    if (updateError) throw updateError;

    revalidatePath(`/professores/${teacherId}/pagamentos`);
    return { success: true };
  } catch (error) {
    console.error("Erro no processamento do pagamento:", error);
    return { success: false, error: "Falha ao registrar pagamento." };
  }
}

export async function getTeacherPaymentHistory(
  teacherId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  payments: PaymentHistoryItem[];
  totalPages: number;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();

  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  const { data, count, error } = await supabase
    .from("teacher_payments")
    .select(
      `
      id,
      billing_month,
      essays_count,
      total_amount,
      status,
      receipt_url,
      processed_at
    `,
      { count: "exact" }
    )
    .eq("teacher_id", teacherId)
    .order("billing_month", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (error) {
    console.error("Erro ao buscar histórico de pagamentos:", error);
    return { payments: [], totalPages: 0, error };
  }

  const payments = await Promise.all(
    data.map(async (payment) => ({
      ...payment,
      receipt_url: await getReceiptAccessUrl(supabase, payment.receipt_url),
    }))
  );

  return {
    payments,
    totalPages: count ? Math.ceil(count / limit) : 0,
    error,
  };
}

export async function exportTeacherPaymentsCsv(payload: { teacherId: string }) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teacher_payments")
    .select("*")
    .eq("teacher_id", payload.teacherId)
    .order("billing_month", { ascending: false });

  if (error) throw new Error("Erro ao buscar dados para exportação do histórico");

  const payments = await Promise.all(
    data.map(async (payment) => ({
      ...payment,
      receipt_url: await getReceiptAccessUrl(supabase, payment.receipt_url),
    }))
  );

  const columns = [
    {
      header: "Data do Pagamento",
      key: (row: PaymentHistoryItem) =>
        row.processed_at ? new Date(row.processed_at).toLocaleDateString("pt-BR") : "-",
    },
    {
      header: "Período de Referência",
      key: (row: PaymentHistoryItem) => {
        if (!row.billing_month) return "-";
        const date = new Date(row.billing_month);
        return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
      },
    },
    {
      header: "Qtd. Redações",
      key: (row: PaymentHistoryItem) => row.essays_count?.toString() || "0",
    },
    {
      header: "Valor Total",
      key: (row: PaymentHistoryItem) =>
        row.total_amount
          ? `R$ ${Number(row.total_amount).toFixed(2).replace(".", ",")}`
          : "R$ 0,00",
    },
    {
      header: "Status",
      key: (row: PaymentHistoryItem) => {
        if (row.status === "paid") return "Pago";
        if (row.status === "pending") return "Pendente";
        return "Processando";
      },
    },
    {
      header: "Link do Comprovante",
      key: (row: PaymentHistoryItem) => row.receipt_url || "Não anexado",
    },
  ];

  return generateCsv(payments, columns);
}
