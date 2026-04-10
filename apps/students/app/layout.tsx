import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { TooltipProvider } from "@repo/ui/components/tooltip";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend"
});

export const metadata: Metadata = {
  title: "Projeto 1000 - Alunos",
  description: "Sistema de correção de redações para o ENEM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${lexend.variable} font-sans antialiased`} suppressHydrationWarning>
        <ReactQueryProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
