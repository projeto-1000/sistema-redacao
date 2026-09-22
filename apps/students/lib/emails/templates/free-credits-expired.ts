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
      label: "Continuar minha evolução",
      url: plansUrl,
    },

    extraContentHtml: `
  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="
      background-color: #eff6ff;
      border-radius: 12px;
      border: 1px solid #bfdbfe;
    "
  >
    <tr>
      <td style="padding: 22px 24px;">
        <p
          style="
            margin: 0 0 6px 0;
            color: #1d4ed8;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          "
        >
          Continue de onde parou
        </p>

        <p
          style="
            margin: 0 0 10px 0;
            color: #111827;
            font-size: 18px;
            font-weight: 800;
          "
        >
          Sua evolução não precisa parar aqui
        </p>

        <p
          style="
            margin: 0 0 8px 0;
            color: #4b5563;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          Com um plano do Projeto 1000, você continua tendo acesso a:
        </p>

        <p
          style="
            margin: 0;
            color: #4b5563;
            font-size: 13px;
            line-height: 1.8;
          "
        >
          • correções completas por competência<br>
          • comentários e apontamentos no texto<br>
          • principal gargalo e próximos passos<br>
          • tarefas de reescrita para praticar
        </p>
      </td>
    </tr>
  </table>
`,

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
