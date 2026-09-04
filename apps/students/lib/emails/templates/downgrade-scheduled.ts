import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildDowngradeScheduledEmailParams {
  firstName: string;
  currentPlanName: string;
  newPlanName: string;
  effectiveAt: string;
  nextAmount: string;
  subscriptionUrl: string;
}

export const downgradeScheduledEmail = {
  subject: "Sua mudança de plano foi agendada",
  preheader:
    "Seu plano atual continua ativo até o fim do ciclo. Depois disso, a mudança acontece automaticamente.",
};

export function buildDowngradeScheduledEmailHtml({
  firstName,
  currentPlanName,
  newPlanName,
  effectiveAt,
  nextAmount,
  subscriptionUrl,
}: BuildDowngradeScheduledEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safeCurrentPlanName = escapeHtml(currentPlanName);
  const safeNewPlanName = escapeHtml(newPlanName);
  const safeEffectiveAt = escapeHtml(effectiveAt);
  const safeNextAmount = escapeHtml(nextAmount);

  return buildEmailLayout({
    eyebrow: "MUDANÇA AGENDADA",
    title: `${safeFirstName}, sua mudança de plano já está programada`,
    preheader: downgradeScheduledEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Recebemos sua solicitação para mudar do plano
        <strong>${safeCurrentPlanName}</strong> para o
        <strong>${safeNewPlanName}</strong>.
      </p>

      <p style="margin: 0 0 16px 0;">
        Como essa mudança acontece apenas no próximo ciclo,
        <strong>seu plano atual continua funcionando normalmente até ${safeEffectiveAt}</strong>.
      </p>

      <p style="margin: 0;">
        Até lá, você continua com os benefícios e créditos do plano atual.
        Depois dessa data, a mudança será aplicada automaticamente.
      </p>
    `,

    action: {
      label: "Ver minha assinatura",
      url: subscriptionUrl,
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
                margin: 0 0 12px 0;
                color: #1d4ed8;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.8px;
                text-transform: uppercase;
              "
            >
              Resumo da mudança
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Plano atual: <strong>${safeCurrentPlanName}</strong>
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Novo plano: <strong>${safeNewPlanName}</strong>
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Mudança válida a partir de: <strong>${safeEffectiveAt}</strong>
            </p>

            <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Próxima cobrança: <strong>${safeNextAmount}</strong>
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText: "Você recebeu este e-mail porque solicitou uma mudança de plano no Projeto 1000.",
  });
}

export function buildDowngradeScheduledEmailText({
  firstName,
  currentPlanName,
  newPlanName,
  effectiveAt,
  nextAmount,
  subscriptionUrl,
}: BuildDowngradeScheduledEmailParams) {
  return `Olá, ${firstName}!

Sua mudança de plano foi agendada.

Você solicitou a mudança do plano ${currentPlanName} para o ${newPlanName}.

Seu plano atual continua funcionando normalmente até ${effectiveAt}. Depois dessa data, a mudança será aplicada automaticamente.

Próxima cobrança: ${nextAmount}

Ver minha assinatura:
${subscriptionUrl}

Equipe Projeto 1000`;
}
