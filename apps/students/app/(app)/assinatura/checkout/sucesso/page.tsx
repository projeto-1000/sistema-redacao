import { getCheckoutSuccessData } from "@/app/actions/checkout-success";
import { CheckoutSuccessCard } from "@/components/checkout/checkout-success-card";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assinatura criada",
};

interface CheckoutSuccessPageProps {
  searchParams: Promise<{
    subscriptionId?: string | string[];
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const subscriptionId = Array.isArray(params.subscriptionId)
    ? params.subscriptionId[0]
    : params.subscriptionId;

  if (!subscriptionId) {
    redirect("/assinatura");
  }

  const result = await getCheckoutSuccessData(subscriptionId);

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "not_found") {
    notFound();
  }

  return (
    <div className="min-h-dvh px-2 py-4 md:px-10 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-3xl items-center justify-center">
        <CheckoutSuccessCard data={result.data} />
      </div>
    </div>
  );
}