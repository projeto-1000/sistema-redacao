import { LucideIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { NewEssayTopicPicker } from "@/components/topics/new-essay-topic-picker";

interface ActionCardProps {
  title: string;
  description: string;
  buttonText: string;
  icon: LucideIcon;
  href?: string;
  opensTopicPicker?: boolean;
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
  opensTopicPicker = false,
  variant = "default",
}: ActionCardProps) {
  const style = variants[variant];

  return (
    <div className="relative flex h-full flex-col rounded-4xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-6 md:p-4 lg:p-6">
      <div className="mb-4 flex items-center gap-2 md:mb-0 md:block">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full md:mb-4 md:h-14 md:w-14",
            style.iconBg
          )}
        >
          <Icon className={cn("size-4.5 md:size-6", style.iconColor)} />
        </div>

        <h3 className="text-[18px] font-bold tracking-tight md:mb-3 md:tracking-tighter lg:text-xl lg:tracking-tight">
          {title}
        </h3>
      </div>

      <p className="mb-6 text-sm leading-relaxed text-slate-500 md:mb-4">{description}</p>

      {opensTopicPicker ? (
        <NewEssayTopicPicker>
          <Button
            variant={variant}
            className={cn("mt-auto h-12 w-full rounded-2xl font-bold shadow-lg")}
          >
            {buttonText}
          </Button>
        </NewEssayTopicPicker>
      ) : (
        href && (
          <Button
            asChild
            variant={variant}
            className={cn("mt-auto h-12 w-full rounded-2xl font-bold shadow-lg")}
          >
            <Link href={href}>{buttonText}</Link>
          </Button>
        )
      )}
    </div>
  );
}
