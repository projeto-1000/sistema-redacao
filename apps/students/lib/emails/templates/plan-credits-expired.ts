import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildPlanCreditsExpiredEmailParams {
  firstName: string;
  expiredCredits: number;
  planName: string;
  nextCycleAt: string;
  dashboardUrl: string;
}

export const planCreditsExpiredEmail = {
  subject: "Seu ciclo de créditos foi encerrado",
  preheader:
    "Os créditos não utilizados do ciclo anterior expiraram. Confira as informações do seu plano.",
};

export function buildPlanCreditsExpiredEmailHtml({
  firstName,
  expiredCredits,
  planName,
  nextCycleAt,
  dashboardUrl,
}: BuildPlanCreditsExpiredEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safePlanName = escapeHtml(planName);
  const safeNextCycleAt = escapeHtml(nextCycleAt);

  return buildEmailLayout({
    eyebrow: "NOVO CICLO",
    title: `${safeFirstName}, seu ciclo anterior foi encerrado`,
    preheader: planCreditsExpiredEmail.preheader,

    contentHtml: `
      <p style="margin:0 0 16px;">
        O ciclo anterior do seu plano <strong>${safePlanName}</strong> chegou ao fim
        e <strong>${expiredCredits} crédito${expiredCredits === 1 ? "" : "s"}</strong>
        não utilizado${expiredCredits === 1 ? "" : "s"} expirou.
      </p>

      <p style="margin:0;">
        Os créditos do plano são renovados por ciclo e não acumulam para o período seguinte.
        Vale ficar de olho na validade para aproveitar ao máximo cada correção.
      </p>
    `,

    action: {
      label: "Acessar minha conta",
      url: dashboardUrl,
    },

    extraContentHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background-color:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
        <tr>
          <td style="padding:22px 24px;">
            <p style="margin:0 0 6px;color:#1d4ed8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;">
              Seu plano continua ativo
            </p>
            <p style="margin:0;color:#4b5563;font-size:13px;line-height:1.6;">
              Próxima referência de ciclo: <strong>${safeNextCycleAt}</strong>.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque créditos não utilizados do seu plano expiraram no Projeto 1000.",
  });
}

export function buildPlanCreditsExpiredEmailText({
  firstName,
  expiredCredits,
  planName,
  nextCycleAt,
  dashboardUrl,
}: BuildPlanCreditsExpiredEmailParams) {
  return `Olá, ${firstName}!

O ciclo anterior do plano ${planName} chegou ao fim e ${expiredCredits} crédito(s) não utilizado(s) expirou(aram).

Os créditos do plano não acumulam para o ciclo seguinte.

Próxima referência de ciclo: ${nextCycleAt}

Acessar minha conta:
${dashboardUrl}

Equipe Projeto 1000`;
}
