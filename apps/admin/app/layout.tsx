import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { TooltipProvider } from "@repo/ui/components/tooltip";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend"
});


export const metadata: Metadata = {
  title: "Projeto 1000 - Admin",
  description: "Painel Administrativo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${lexend.variable} font-sans antialiased`}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
