import { createTailwindAuditConfig } from "@repo/eslint-config/tailwind-audit";

export default createTailwindAuditConfig({
  entryPoint: "app/globals.css",
  knownClasses: [
    "arrow-slide",
    "card-soft",
    "faq-bar",
    "faq-plus",
    "float-blob",
    "highlight-mark",
    "highlight-thick",
    "icon-bubble",
    "input-base",
    "marquee-track",
    "muted-ink",
    "on-navy",
    "paper-block",
    "pill",
    "press-fx",
    "reveal",
    "reveal-in",
    "serif-accent",
    "sticker",
    "sticker-tilt-left",
    "sticker-tilt-right",
    "tilt-card",
  ],
});
