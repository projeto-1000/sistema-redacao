"use client";

import { captureRegistrationAttribution } from "@repo/utils/registration-tracking";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function RegistrationAttributionCapture() {
  const pathname = usePathname();
  useEffect(() => {
    captureRegistrationAttribution();
  }, [pathname]);
  return null;
}
