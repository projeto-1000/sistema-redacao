import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildDowngradeCompletedEmailParams {
  firstName: string;
  previousPlanName: string;
  newPlanName: string;
  amount: string;
  credits: number;
  subscriptionUrl: string;
}

export const downgradeCompletedEmail = {
  subject: "Sua mudança de plano foi concluída",
  preheader:
    "O plano que você havia agendado já entrou em vigor. Confira os detalhes do novo ciclo.",
};

export function buildDowngradeCompletedEmailHtml({
  firstName,
  previousPlanName,
  newPlanName,
  amount,
  credits,
  subscriptionUrl,
}: BuildDowngradeCompletedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safePreviousPlanName = escapeHtml(previousPlanName);
  const safeNewPlanName = escapeHtml(newPlanName);
  const safeAmount = escapeHtml(amount);

  return buildEmailLayout({
    eyebrow: "MUDANÇA CONCLUÍDA",
    title: `${safeFirstName}, seu novo plano já está ativo`,
    preheader: downgradeCompletedEmail.preheader,

    contentHtml: `
      <p style="margin:0 0 16px;">
        A mudança que você havia agendado foi concluída.
      </p>

      <p style="margin:0;">
        A partir deste ciclo, sua assinatura passa do plano
        <strong>${safePreviousPlanName}</strong> para o
        <strong>${safeNewPlanName}</strong>.
      </p>
    `,

    action: {
      label: "Ver minha assinatura",
      url: subscriptionUrl,
    },

    extraContentHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background-color:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
        <tr>
          <td style="padding:22px 24px;">
            <p style="margin:0 0 10px;color:#1d4ed8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;">
              Novo ciclo
            </p>
            <p style="margin:0 0 8px;color:#4b5563;font-size:13px;">Plano: <strong>${safeNewPlanName}</strong></p>
            <p style="margin:0 0 8px;color:#4b5563;font-size:13px;">Valor: <strong>${safeAmount}</strong></p>
            <p style="margin:0;color:#4b5563;font-size:13px;">Créditos por ciclo: <strong>${credits}</strong></p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque uma mudança de plano agendada foi concluída no Projeto 1000.",
  });
}

export function buildDowngradeCompletedEmailText({
  firstName,
  previousPlanName,
  newPlanName,
  amount,
  credits,
  subscriptionUrl,
}: BuildDowngradeCompletedEmailParams) {
  return `Olá, ${firstName}!

Sua mudança do plano ${previousPlanName} para o ${newPlanName} foi concluída.

Valor: ${amount}
Créditos por ciclo: ${credits}

${subscriptionUrl}

Equipe Projeto 1000`;
}
