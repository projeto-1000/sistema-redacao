import {
  CreditCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Compra segura",
    description: "Pagamento processado de forma segura.",
  },
  {
    icon: Sparkles,
    title: "Créditos extras",
    description: "Use quando precisar de novas correções.",
  },
  {
    icon: CreditCard,
    title: "Pagamento único",
    description: "Sem alterar ou renovar sua assinatura.",
  },
];

export function PurchaseCallout() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 md:px-8">
      <div className="grid gap-6 md:grid-cols-3 md:divide-x md:divide-slate-100">
        {benefits.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex items-center gap-4 md:px-6 first:md:pl-0 last:md:pr-0"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Icon className="size-5" />
            </div>

            <div>
              <p className="font-extrabold text-slate-800">
                {title}
              </p>

              <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}