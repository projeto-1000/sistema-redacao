import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Lexend } from "next/font/google";

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
    <html lang="pt-BR">
      <body className={`${lexend.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
