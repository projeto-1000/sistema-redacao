import { createTailwindAuditConfig } from "@repo/eslint-config/tailwind-audit";

export default createTailwindAuditConfig({
  entryPoint: "app/globals.css",
  knownClasses: [
    "auth-page-background",
    "bg-gradient-soft",
    "login-autofill-detection",
    "no-scrollbar",
    "page-transition",
    "story-link",
  ],
});
