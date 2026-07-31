import "./globals.css";
import "@repo/ui/styles.css";
import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { Toaster } from "@repo/ui/components/toaster";
import { RouteTransition } from "@repo/ui/components/route-transition";

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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${lexend.variable} font-sans antialiased`} suppressHydrationWarning>
        <TooltipProvider>
          <RouteTransition>
            {children}
          </RouteTransition>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
