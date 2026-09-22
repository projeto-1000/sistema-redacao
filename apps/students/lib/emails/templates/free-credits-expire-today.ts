import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildFreeCreditsExpireTodayEmailParams {
  firstName: string;
  credits: number;
  essaysUrl: string;
}

export const freeCreditsExpireTodayEmail = {
  subject: "Seu crédito gratuito expira hoje ⏰",
  preheader: "É o último dia para usar seu crédito gratuito e enviar uma redação para correção.",
};

export function buildFreeCreditsExpireTodayEmailHtml({
  firstName,
  credits,
  essaysUrl,
}: BuildFreeCreditsExpireTodayEmailParams) {
  const safeFirstName = escapeHtml(firstName);

  const creditLabel = credits === 1 ? "crédito gratuito" : "créditos gratuitos";
  const creditPronoun = credits === 1 ? "ele" : "eles";

  return buildEmailLayout({
    eyebrow: "ÚLTIMO DIA",
    title: `${safeFirstName}, seu ${creditLabel} expira hoje`,
    preheader: freeCreditsExpireTodayEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Hoje é o último dia para usar <strong>${credits} ${creditLabel}</strong>
        que ${credits === 1 ? "está" : "estão"} disponível${credits === 1 ? "" : "is"} na sua conta.
      </p>

      <p style="margin: 0 0 16px 0;">
        Se você ainda não testou a plataforma, essa é uma ótima oportunidade:
        envie uma redação e receba uma correção completa para entender seus pontos fortes,
        identificar o que mais precisa de atenção e saber exatamente no que focar no próximo texto.
      </p>

      <p style="margin: 0;">
        Se já tem uma redação em mente, aproveita hoje — amanhã ${creditPronoun}
        ${credits === 1 ? "não estará" : "não estarão"} mais disponível${credits === 1 ? "" : "is"}.
      </p>
    `,

    action: {
      label: "Usar meu crédito agora",
      url: essaysUrl,
    },

    extraContentHtml: `
      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="
          background-color: #fff8e6;
          border-radius: 12px;
          border: 1px solid #f7c325;
        "
      >
        <tr>
          <td style="padding: 22px 24px;">
            <p
              style="
                margin: 0 0 6px 0;
                color: #9a6700;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.8px;
              "
            >
              Aproveite enquanto ainda dá tempo
            </p>

            <p
              style="
                margin: 0 0 8px 0;
                color: #111827;
                font-size: 18px;
                font-weight: 800;
              "
            >
              Seu crédito termina hoje
            </p>

            <p
              style="
                margin: 0;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              Depois de hoje, ${credits === 1 ? "esse crédito expira" : "esses créditos expiram"}
              e não ${credits === 1 ? "poderá" : "poderão"} mais ser utilizado${credits === 1 ? "" : "s"}.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque possui crédito gratuito que expira hoje no Projeto 1000.",
  });
}

export function buildFreeCreditsExpireTodayEmailText({
  firstName,
  credits,
  essaysUrl,
}: BuildFreeCreditsExpireTodayEmailParams) {
  const creditLabel = credits === 1 ? "crédito gratuito" : "créditos gratuitos";

  return `Olá, ${firstName}!

Seu ${creditLabel} expira hoje.

Hoje é o último dia para usar ${credits} ${creditLabel} disponível na sua conta.

Se você ainda não testou a plataforma, essa é uma ótima oportunidade: envie uma redação e receba uma correção completa para entender seus pontos fortes, identificar o que mais precisa de atenção e saber exatamente no que focar no próximo texto.

Se já tem uma redação em mente, aproveita hoje — amanhã esse crédito não estará mais disponível.

Usar meu crédito agora:
${essaysUrl}

Equipe Projeto 1000`;
}
