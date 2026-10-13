import { cn } from "../lib/utils";

//TODO: criar type compartilhado
const AXIS_BADGE_STYLES: Record<string, string> = {
  "Meio Ambiente": "bg-green-100 text-green-700 border-green-200",
  "Questões Sociais": "bg-rose-100 text-rose-700 border-rose-200",
  Saúde: "bg-red-100 text-red-700 border-red-200",
  Cultura: "bg-purple-100 text-purple-700 border-purple-200",
  "Direitos e Cidadania": "bg-orange-100 text-orange-700 border-orange-200",
  Educação: "bg-blue-100 text-blue-700 border-blue-200",
  Tecnologia: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Economia: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

interface ThemeBadgeProps {
  value: string;
  className?: string;
}

export function ThemeBadge({ value, className }: ThemeBadgeProps) {
  const style = AXIS_BADGE_STYLES[value];

  return <span className={cn(style, className)}>{value}</span>;
}
