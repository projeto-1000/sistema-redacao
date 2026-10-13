import Link from "next/link";
import { ElementType } from "react";

interface ActionCardProps {
  href: string;
  title: string;
  description: string;
  icon: ElementType;
  bgIcon: ElementType;
  variant: "primary" | "secondary";
}

export function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  bgIcon: BgIcon,
  variant,
}: ActionCardProps) {
  const styles = {
    primary: {
      wrapper: "bg-primary hover:bg-primary/90 shadow-amber-200",
      description: "text-amber-100",
    },
    secondary: {
      wrapper: "bg-secondary hover:bg-secondary/90 shadow-blue-200",
      description: "text-blue-100",
    },
  };

  const activeStyle = styles[variant];

  return (
    <Link href={href} prefetch={false} className="group block">
      <div
        className={`${activeStyle.wrapper} relative flex h-32 flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-lg transition-all`}
      >
        <div className="relative z-10">
          <div className="mb-2 w-fit rounded-full bg-white/20 p-1.5">
            <Icon className="size-5 text-white" />
          </div>
          <h3 className="flex items-center gap-2 text-xl font-bold text-white">{title}</h3>
          <p className={`${activeStyle.description} mt-1 text-sm`}>{description}</p>
        </div>
        <BgIcon className="absolute top-1/2 right-2 size-28 -translate-y-1/2 text-white opacity-15 transition-transform group-hover:scale-105" />
      </div>
    </Link>
  );
}
