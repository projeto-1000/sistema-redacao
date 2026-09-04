import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildFreeCreditsExpiredEmailParams {
  firstName: string;
  plansUrl: string;
}

export const freeCreditsExpiredEmail = {
  subject: "Seu período gratuito chegou ao fim",
  preheader:
    "Seus créditos gratuitos expiraram, mas você pode continuar evoluindo com um plano do Projeto 1000.",
};

export function buildFreeCreditsExpiredEmailHtml({
  firstName,
  plansUrl,
}: BuildFreeCreditsExpiredEmailParams) {
  const safeFirstName = escapeHtml(firstName);

  return buildEmailLayout({
    eyebrow: "CRÉDITOS GRATUITOS",
    title: `${safeFirstName}, seu período gratuito chegou ao fim`,
    preheader: freeCreditsExpiredEmail.preheader,

    contentHtml: `
      <p style="margin:0 0 16px;">
        Os créditos gratuitos da sua conta expiraram.
      </p>

      <p style="margin:0 0 16px;">
        Mas sua jornada no Projeto 1000 não precisa parar por aqui.
        Com um plano, você continua enviando redações, recebendo correções completas
        e acompanhando sua evolução ao longo do tempo.
      </p>

      <p style="margin:0;">
        Quando quiser continuar, a plataforma está te esperando. 💙
      </p>
    `,

    action: {
      label: "Conhecer os planos",
      url: plansUrl,
    },

    footerText:
      "Você recebeu este e-mail porque os créditos gratuitos da sua conta no Projeto 1000 expiraram.",
  });
}

export function buildFreeCreditsExpiredEmailText({
  firstName,
  plansUrl,
}: BuildFreeCreditsExpiredEmailParams) {
  return `Olá, ${firstName}!

Seus créditos gratuitos expiraram.

Mas sua jornada no Projeto 1000 não precisa parar por aqui.

Conheça nossos planos para continuar enviando redações e acompanhando sua evolução:

${plansUrl}

Equipe Projeto 1000`;
}
