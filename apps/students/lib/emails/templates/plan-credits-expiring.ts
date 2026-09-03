import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildPlanCreditsExpiringEmailParams {
  firstName: string;
  credits: number;
  expiresAt: string;
  essaysUrl: string;
  planName: string;
}

export const planCreditsExpiringEmail = {
  subject: "Você ainda tem créditos para usar este ciclo ✍️",
  preheader:
    "Seus créditos do plano estão perto de expirar. Aproveite para enviar sua próxima redação.",
};

export function buildPlanCreditsExpiringEmailHtml({
  firstName,
  credits,
  expiresAt,
  essaysUrl,
  planName,
}: BuildPlanCreditsExpiringEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safeExpiresAt = escapeHtml(expiresAt);
  const safePlanName = escapeHtml(planName);

  const creditLabel = credits === 1 ? "crédito" : "créditos";

  return buildEmailLayout({
    eyebrow: "SEU PLANO",
    title: `${safeFirstName}, você ainda tem ${credits} ${creditLabel} para usar`,
    preheader: planCreditsExpiringEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Seu ciclo atual do plano <strong>${safePlanName}</strong> está chegando ao fim
        e você ainda tem <strong>${credits} ${creditLabel}</strong> disponível${credits === 1 ? "" : "is"}.
      </p>

      <p style="margin: 0 0 16px 0;">
        Se tem uma redação esperando para sair do rascunho, esse é um ótimo momento para enviar.
        Cada correção ajuda você a entender onde está evoluindo e o que ainda precisa ajustar
        antes da próxima.
      </p>

      <p style="margin: 0;">
        Melhor usar o crédito para evoluir do que deixar ele vencer parado, né?
      </p>
    `,

    action: {
      label: "Enviar uma redação",
      url: essaysUrl,
    },

    extraContentHtml: `
      <table
        role="presentation"
        border="0"
        cellpadding="0"
        cellspacing="0"
        width="100%"
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
                letter-spacing: 0.8px;
                text-transform: uppercase;
              "
            >
              Antes que o ciclo vire
            </p>

            <p
              style="
                margin: 0 0 8px 0;
                color: #111827;
                font-size: 16px;
                font-weight: 700;
              "
            >
              Seus créditos expiram em ${safeExpiresAt}
            </p>

            <p
              style="
                margin: 0;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              Os créditos mensais do plano têm validade dentro do ciclo atual.
              Depois dessa data, os créditos não utilizados expiram.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque possui créditos do seu plano próximos da data de expiração no Projeto 1000.",
  });
}

export function buildPlanCreditsExpiringEmailText({
  firstName,
  credits,
  expiresAt,
  essaysUrl,
  planName,
}: BuildPlanCreditsExpiringEmailParams) {
  const creditLabel = credits === 1 ? "crédito" : "créditos";

  return `Olá, ${firstName}!

Seu ciclo atual do plano ${planName} está chegando ao fim e você ainda tem ${credits} ${creditLabel} disponível.

Se tem uma redação esperando para sair do rascunho, esse é um ótimo momento para enviar. Cada correção ajuda você a entender onde está evoluindo e o que ainda precisa ajustar antes da próxima.

Seus créditos expiram em ${expiresAt}.

Os créditos mensais do plano têm validade dentro do ciclo atual. Depois dessa data, os créditos não utilizados expiram.

Enviar uma redação:
${essaysUrl}

Equipe Projeto 1000`;
}
