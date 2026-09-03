import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildUpgradeCompletedEmailParams {
  firstName: string;
  previousPlanName: string;
  newPlanName: string;
  amountCharged: string;
  creditsAdded: number;
  nextBillingAt: string;
  dashboardUrl: string;
}

export const upgradeCompletedEmail = {
  subject: "Upgrade concluído! Seu novo plano já está ativo 🚀",
  preheader: "Sua mudança de plano foi concluída e os novos benefícios já estão disponíveis.",
};

export function buildUpgradeCompletedEmailHtml({
  firstName,
  previousPlanName,
  newPlanName,
  amountCharged,
  creditsAdded,
  nextBillingAt,
  dashboardUrl,
}: BuildUpgradeCompletedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safePreviousPlanName = escapeHtml(previousPlanName);
  const safeNewPlanName = escapeHtml(newPlanName);
  const safeAmountCharged = escapeHtml(amountCharged);
  const safeNextBillingAt = escapeHtml(nextBillingAt);

  const creditLabel = creditsAdded === 1 ? "crédito" : "créditos";

  return buildEmailLayout({
    eyebrow: "UPGRADE CONCLUÍDO",
    title: `${safeFirstName}, seu novo plano já está ativo!`,
    preheader: upgradeCompletedEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Sua mudança do plano <strong>${safePreviousPlanName}</strong> para o
        <strong>${safeNewPlanName}</strong> foi concluída com sucesso.
      </p>

      <p style="margin: 0 0 16px 0;">
        Como o upgrade entra em vigor na hora, os benefícios do novo plano
        já estão disponíveis na sua conta.
      </p>

      <p style="margin: 0;">
        Também adicionamos <strong>${creditsAdded} ${creditLabel}</strong>
        referentes à mudança. Agora é só aproveitar esse novo fôlego nos estudos. 🚀
      </p>
    `,

    action: {
      label: "Acessar meu novo plano",
      url: dashboardUrl,
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
              Plano anterior: <strong>${safePreviousPlanName}</strong>
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Novo plano: <strong>${safeNewPlanName}</strong>
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Valor cobrado na mudança: <strong>${safeAmountCharged}</strong>
            </p>

            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Créditos adicionados: <strong>${creditsAdded}</strong>
            </p>

            <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.6;">
              Próxima cobrança: <strong>${safeNextBillingAt}</strong>
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText: "Você recebeu este e-mail porque realizou um upgrade de plano no Projeto 1000.",
  });
}

export function buildUpgradeCompletedEmailText({
  firstName,
  previousPlanName,
  newPlanName,
  amountCharged,
  creditsAdded,
  nextBillingAt,
  dashboardUrl,
}: BuildUpgradeCompletedEmailParams) {
  return `Olá, ${firstName}!

Seu upgrade foi concluído com sucesso.

Você mudou do plano ${previousPlanName} para o ${newPlanName}, e o novo plano já está ativo.

Créditos adicionados: ${creditsAdded}
Valor cobrado na mudança: ${amountCharged}
Próxima cobrança: ${nextBillingAt}

Acessar meu novo plano:
${dashboardUrl}

Equipe Projeto 1000`;
}
