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
  variant
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
    <Link href={href} className="block group">
      <div className={`${activeStyle.wrapper} transition-all p-6 rounded-3xl relative overflow-hidden h-32 flex flex-col justify-between shadow-lg`}>
        <div className="relative z-10">
          <div className="bg-white/20 w-fit p-1.5 rounded-full mb-2">
            <Icon className="text-white size-5" />
          </div>
          <h3 className="text-white font-bold text-xl flex items-center gap-2">
            {title}
          </h3>
          <p className={`${activeStyle.description} text-sm mt-1`}>
            {description}
          </p>
        </div>
        <BgIcon className="absolute right-2 top-1/2 -translate-y-1/2 size-28 text-white opacity-15 group-hover:scale-105 transition-transform" />
      </div>
    </Link>
  );
}