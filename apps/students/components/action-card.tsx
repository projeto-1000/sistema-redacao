import { LucideIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";

interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  icon: LucideIcon;
  href: string;
  variant?: "primary" | "secondary" | "dark";
}

const variants = {
  primary: {
    iconBg: "bg-[#FFF9E6]",
    iconColor: "text-[#EBC84C]",
    button: "bg-[#EBC84C] hover:bg-[#D4B443] text-slate-900 shadow-[#EBC84C]/20",
  },
  secondary: {
    iconBg: "bg-[#EEF2FF]",
    iconColor: "text-[#2563EB]",
    button: "bg-[#2563EB] hover:bg-[#1E40AF] text-white shadow-[#2563EB]/20",
  },
  dark: {
    iconBg: "bg-[#F1F5F9]",
    iconColor: "text-[#1E293B]",
    button: "bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-[#0F172A]/20",
  },
};

export function ActionCard({
  title,
  description,
  buttonText,
  icon: Icon,
  href,
  variant = "primary",
}: ActionCardProps) {
  const style = variants[variant];

  return (
    <div className="relative flex flex-col p-4 sm:p-6 md:p-4 lg:p-6 bg-white border border-slate-100 rounded-4xl shadow-sm transition-all hover:shadow-md h-full">
      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-4", style.iconBg)}>
        <Icon className={cn("size-6", style.iconColor)} />
      </div>

      <div className="flex-1 mb-4">
        <h3 className="text-xl font-bold mb-3 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed max-w-60">
          {description}
        </p>
      </div>


      <Link href={href}>
        <Button
          className={cn(
            "w-full py-6 rounded-2xl font-bold transition-all shadow-lg",
            style.button
          )}
        >
          {buttonText}
        </Button>
      </Link>
    </div>
  );
}