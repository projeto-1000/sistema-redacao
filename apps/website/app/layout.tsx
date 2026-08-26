import type { Metadata } from "next";
import Script from "next/script";
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
      <head>
        <Script id="meta-pixel" strategy="beforeInteractive">
          {`
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '1498795297218230');
      fbq('track', 'PageView');
    `}
        </Script>
      </head>
      <body className={poppins.variable}>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1498795297218230&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
