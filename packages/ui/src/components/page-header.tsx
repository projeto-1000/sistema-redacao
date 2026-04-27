import Link from "next/link";
import { Button } from "./button";
interface PageHeaderAction {
  label: string;
  href: string;
  icon?: React.ReactNode;
}
interface ProfileHeaderProps {
  title: string;
  subtitle: string;
  action?: PageHeaderAction;
}

export function PageHeader({ title, subtitle, action }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

      <div>
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-[#8B8265]">
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