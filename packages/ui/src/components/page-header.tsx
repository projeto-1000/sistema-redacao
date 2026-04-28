import Link from "next/link";
import { Button } from "./button";
import { ReactNode } from "react";

interface PageHeaderAction {
  label: string;
  href: string;
  icon?: ReactNode;
}

interface PageHeaderProps {
  title: string;
  subtitle: ReactNode;
  action?: PageHeaderAction;
  variant?: "default" | "admin";
}

export function PageHeader({
  title,
  subtitle,
  action,
  variant = "default"
}: PageHeaderProps) {

  const subtitleColor = variant === "admin" ? "text-slate-500" : "text-[#8B8265]";

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      <div>
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          {title}
        </h2>

        <p className={subtitleColor}>
          {subtitle}
        </p>
      </div>

      {action && (
        <Button asChild className="rounded-3xl font-bold h-10">
          <Link href={action.href}>
            {action.icon}
            {action.label}
          </Link>
        </Button>
      )}
    </div>
  )
}