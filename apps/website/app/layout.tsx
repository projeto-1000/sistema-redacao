import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Projeto 1000 | Correção que te mostra a direção",
    template: "%s | Projeto 1000",
  },
  description:
    "Correção humana de redação nas cinco competências do Enem, com principal gargalo, próximos passos e tarefa de reescrita.",
  icons: { icon: "/images/projeto1000-icone.png" },
  openGraph: { type: "website", siteName: "Projeto 1000" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={poppins.variable}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
