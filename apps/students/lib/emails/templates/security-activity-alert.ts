import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildSecurityActivityAlertEmailParams {
  occurredAt: string;
  device?: string;
  location?: string;
  securityUrl: string;
}

export const securityActivityAlertEmail = {
  subject: "Novo acesso à sua conta do Projeto 1000",
  preheader:
    "Detectamos um novo acesso à sua conta. Confira os detalhes e veja o que fazer caso não reconheça.",
};

export function buildSecurityActivityAlertEmailHtml({
  occurredAt,
  device,
  location,
  securityUrl,
}: BuildSecurityActivityAlertEmailParams) {
  const safeOccurredAt = escapeHtml(occurredAt);
  const safeDevice = device ? escapeHtml(device) : null;
  const safeLocation = location ? escapeHtml(location) : null;

  return buildEmailLayout({
    eyebrow: "SEGURANÇA DA CONTA",
    title: "Detectamos um novo acesso",
    preheader: securityActivityAlertEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Houve um novo acesso à sua conta no <strong>Projeto 1000</strong>.
      </p>

      <p style="margin: 0;">
        Se foi você, está tudo certo e não é necessário fazer nada.
        Se não reconhece esse acesso, recomendamos alterar sua senha.
      </p>
    `,

    action: {
      label: "Revisar segurança da conta",
      url: securityUrl,
    },

    extraContentHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background-color:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
        <tr>
          <td style="padding:22px 24px;">
            <p style="margin:0 0 10px;color:#1d4ed8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;">
              Detalhes do acesso
            </p>

            <p style="margin:0 0 8px;color:#4b5563;font-size:13px;line-height:1.6;">
              Data e hora: <strong>${safeOccurredAt}</strong>
            </p>

            ${
              safeDevice
                ? `<p style="margin:0 0 8px;color:#4b5563;font-size:13px;line-height:1.6;">
                    Dispositivo: <strong>${safeDevice}</strong>
                  </p>`
                : ""
            }

            ${
              safeLocation
                ? `<p style="margin:0;color:#4b5563;font-size:13px;line-height:1.6;">
                    Local aproximado: <strong>${safeLocation}</strong>
                  </p>`
                : ""
            }
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail por causa de uma atividade de segurança identificada na sua conta do Projeto 1000.",
  });
}

export function buildSecurityActivityAlertEmailText({
  occurredAt,
  device,
  location,
  securityUrl,
}: BuildSecurityActivityAlertEmailParams) {
  return `Detectamos um novo acesso à sua conta do Projeto 1000.

Data e hora: ${occurredAt}
${device ? `Dispositivo: ${device}\n` : ""}${location ? `Local aproximado: ${location}\n` : ""}

Se foi você, não precisa fazer nada.

Se não reconhece esse acesso, revise a segurança da sua conta e altere sua senha:

${securityUrl}

Equipe Projeto 1000`;
}
