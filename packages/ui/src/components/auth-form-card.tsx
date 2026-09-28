import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { cn } from "../lib/utils";

interface AuthFormCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthFormCard({
  title,
  description,
  children,
  footer,
  className,
}: AuthFormCardProps) {
  return (
    <Card
      className={cn(
        "w-full max-w-[520px] gap-0 rounded-[28px] border border-slate-200/80 bg-white/95 px-5 py-7 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.45)] backdrop-blur-sm md:px-8 md:py-9",
        className,
      )}
    >
      <CardHeader className="gap-2 px-0 pb-7 text-left">
        <CardTitle className="text-3xl font-bold leading-tight text-slate-950">
          {title}
        </CardTitle>

        {description && (
          <CardDescription className="text-sm leading-relaxed text-slate-500 sm:text-base">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      {children && <CardContent className="p-0">{children}</CardContent>}

      {footer && (
        <CardFooter className="mt-7 justify-center border-t border-slate-200 px-0 pt-6 text-center text-sm text-slate-500">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
