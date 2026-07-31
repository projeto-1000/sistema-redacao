import "./globals.css";
import "@repo/ui/styles.css";
import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { TooltipProvider } from "@repo/ui/components/tooltip";

import { Footer } from "@repo/ui/components/footer";
import { Toaster } from "@repo/ui/components/toaster";
import { RouteTransition } from "@repo/ui/components/route-transition";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend"
});

export const metadata: Metadata = {
  title: {
    template: "%s - Projeto 1000",
    default: "Projeto 1000 - Área do Professor",
  },
  description: "Sistema de correção de redações para o ENEM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${lexend.variable} font-sans antialiased`} suppressHydrationWarning>
        <TooltipProvider>
          <RouteTransition>
            {children}
          </RouteTransition>
          <Footer />
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
