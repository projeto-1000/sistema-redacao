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
  variant?: "default" | "secondary" | "dark";
}

const variants = {
  default: {
    iconBg: "bg-[#FFF9E6]",
    iconColor: "text-[#EBC84C]",
  },
  secondary: {
    iconBg: "bg-[#EEF2FF]",
    iconColor: "text-[#2563EB]",
  },
  dark: {
    iconBg: "bg-[#F1F5F9]",
    iconColor: "text-[#1E293B]",
  },
};

export function ActionCard({
  title,
  description,
  buttonText,
  icon: Icon,
  href,
  variant = "default",
}: ActionCardProps) {
  const style = variants[variant];

  return (
    <div className="relative flex flex-col p-4 sm:p-6 md:p-4 lg:p-6 bg-white border border-slate-100 rounded-4xl shadow-sm transition-all hover:shadow-md h-full">
      <div className="flex md:block items-center gap-2 mb-4 md:mb-0">
        <div className={cn("w-8 h-8 md:w-14 md:h-14 rounded-full flex items-center justify-center md:mb-4", style.iconBg)}>
          <Icon className={cn("size-4.5 md:size-6", style.iconColor)} />
        </div>

        <h3 className="text-[18px] lg:text-xl font-bold md:mb-3 tracking-tight md:tracking-tighter lg:tracking-tight">
          {title}
        </h3>

      </div>

      <p className="text-sm text-slate-500 leading-relaxed mb-6 md:mb-4">
        {description}
      </p>

      <Button
        asChild
        variant={variant}
        className={cn(
          "w-full h-12 rounded-2xl font-bold shadow-lg",
        )}
      >
        <Link href={href}>
          {buttonText}
        </Link>
      </Button>
    </div>
  );
}