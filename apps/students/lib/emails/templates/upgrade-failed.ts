import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildUpgradeFailedEmailParams {
  firstName: string;
  currentPlanName: string;
  requestedPlanName: string;
  paymentSettingsUrl: string;
}

export const upgradeFailedEmail = {
  subject: "Não conseguimos concluir seu upgrade",
  preheader:
    "Seu plano atual continua ativo. Confira a forma de pagamento para tentar a mudança novamente.",
};

export function buildUpgradeFailedEmailHtml({
  firstName,
  currentPlanName,
  requestedPlanName,
  paymentSettingsUrl,
}: BuildUpgradeFailedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safeCurrentPlanName = escapeHtml(currentPlanName);
  const safeRequestedPlanName = escapeHtml(requestedPlanName);

  return buildEmailLayout({
    eyebrow: "UPGRADE NÃO CONCLUÍDO",
    title: `${safeFirstName}, seu plano atual continua o mesmo`,
    preheader: upgradeFailedEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Tentamos concluir sua mudança do plano
        <strong>${safeCurrentPlanName}</strong> para o
        <strong>${safeRequestedPlanName}</strong>, mas o pagamento do upgrade
        não foi aprovado.
      </p>

      <p style="margin: 0 0 16px 0;">
        Mas fica tranquilo: <strong>seu plano atual continua ativo normalmente</strong>.
        Nada foi alterado na sua assinatura.
      </p>

      <p style="margin: 0;">
        Se ainda quiser fazer o upgrade, confira sua forma de pagamento
        e tente novamente.
      </p>
    `,

    action: {
      label: "Conferir forma de pagamento",
      url: paymentSettingsUrl,
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
              O que acontece agora?
            </p>

            <p
              style="
                margin: 0;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              Você continua no plano <strong>${safeCurrentPlanName}</strong>,
              com os mesmos benefícios e condições atuais, até que uma nova
              tentativa de upgrade seja concluída com sucesso.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque uma tentativa de upgrade de plano no Projeto 1000 não foi concluída.",
  });
}

export function buildUpgradeFailedEmailText({
  firstName,
  currentPlanName,
  requestedPlanName,
  paymentSettingsUrl,
}: BuildUpgradeFailedEmailParams) {
  return `Olá, ${firstName}!

Tentamos concluir sua mudança do plano ${currentPlanName} para o ${requestedPlanName}, mas o pagamento do upgrade não foi aprovado.

Seu plano atual continua ativo normalmente e nada foi alterado na sua assinatura.

Se ainda quiser fazer o upgrade, confira sua forma de pagamento e tente novamente.

Conferir forma de pagamento:
${paymentSettingsUrl}

Equipe Projeto 1000`;
}
