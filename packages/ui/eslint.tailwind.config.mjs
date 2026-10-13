import { createTailwindAuditConfig } from "@repo/eslint-config/tailwind-audit";

export default createTailwindAuditConfig({
  entryPoint: "src/styles.css",
  knownClasses: [
    "auth-page-background",
    "bg-gradient-soft",
    "ignore-selection",
    "login-autofill-detection",
    "no-scrollbar",
    "page-transition",
    "story-link",
    "toaster",
  ],
});
