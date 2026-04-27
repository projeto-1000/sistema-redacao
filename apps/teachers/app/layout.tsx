import "./globals.css";
import "@repo/ui/styles.css";
import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { Toaster } from "sonner";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend"
});

export const metadata: Metadata = {
  title: "Projeto 1000 - Professores",
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
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
