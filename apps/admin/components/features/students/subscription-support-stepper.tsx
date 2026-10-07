import { Check } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

const steps = [
  { label: "Tipo de ação", description: "Escolha o atendimento" },
  { label: "Detalhes", description: "Valores e justificativa" },
  { label: "Confirmação", description: "Revise antes de enviar" },
];

export function SubscriptionSupportStepper({ step }: { step: number }) {
  return (
    <ol
      aria-label="Etapas do atendimento"
      className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      {steps.map((item, index) => {
        const current = step === index + 1;
        const complete = step > index + 1;
        return (
          <li
            key={item.label}
            aria-current={current ? "step" : undefined}
            className="relative flex flex-col items-center text-center"
          >
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-4 left-1/2 h-0.5 w-full",
                  complete ? "bg-blue-500" : "bg-slate-200"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold",
                current
                  ? "border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100"
                  : complete
                    ? "border-blue-600 bg-white text-blue-600"
                    : "border-slate-200 bg-white text-slate-400"
              )}
            >
              {complete ? <Check aria-label="Concluída" className="size-4" /> : index + 1}
            </span>
            <span
              className={cn(
                "mt-3 text-xs font-bold sm:text-sm",
                current ? "text-blue-700" : "text-slate-600"
              )}
            >
              {item.label}
            </span>
            <span className="mt-1 hidden text-[11px] text-slate-500 sm:block">
              {item.description}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
