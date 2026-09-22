import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";

export function TeacherManagementTabs({ active }: { active: "teachers" | "rates" }) {
  return (
    <nav className="flex border-b border-slate-200" aria-label="Gestão de professores">
      <Link
        href="/professores"
        className={cn(
          "border-b-2 px-5 py-3 text-sm font-bold transition-colors",
          active === "teachers" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900",
        )}
      >
        Professores
      </Link>
      <Link
        href="/professores/valores-correcao"
        className={cn(
          "border-b-2 px-5 py-3 text-sm font-bold transition-colors",
          active === "rates" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900",
        )}
      >
        Valores de correção
      </Link>
    </nav>
  );
}
