"use client";

import { passwordRequirements } from "@repo/validators";
import { CheckCircle2, Circle } from "lucide-react";

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  return (
    <div className="space-y-2" aria-live="polite">
      <p className="text-xs font-medium text-slate-600">Sua senha deve ter:</p>
      <ul className="grid gap-1.5 text-xs text-slate-500 sm:grid-cols-2">
        {passwordRequirements.map((requirement) => {
          const isMet = requirement.test(password);
          const Icon = isMet ? CheckCircle2 : Circle;

          return (
            <li
              key={requirement.id}
              className={
                isMet
                  ? "flex items-center gap-2 text-emerald-600"
                  : "flex items-center gap-2"
              }
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{requirement.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
