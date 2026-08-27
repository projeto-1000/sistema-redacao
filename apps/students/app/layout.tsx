import "./globals.css";
import "@repo/ui/styles.css";
import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { Footer } from "@repo/ui/components/footer";
import { Toaster } from "@repo/ui/components/toaster";
import { RouteTransition } from "@repo/ui/components/route-transition";
import Script from "next/script";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend"
});

export const metadata: Metadata = {
  title: {
    template: "%s - Projeto 1000",
    default: "Projeto 1000 - Área do Aluno",
  },
  description: "Sistema de correção de redações para o ENEM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
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
      <body className={`${lexend.variable} font-sans antialiased`} suppressHydrationWarning>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1498795297218230&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
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
