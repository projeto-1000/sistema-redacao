import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildEssaySubmittedEmailParams {
  firstName: string;
  essayTitle: string;
  submittedAt: string;
  essayUrl: string;
  dueAt?: string;
}

export const essaySubmittedEmail = {
  subject: "Redação enviada! Agora é com a gente 💙",
  preheader: "Recebemos sua redação e ela já entrou no fluxo de correção do Projeto 1000.",
};

export function buildEssaySubmittedEmailHtml({
  firstName,
  essayTitle,
  submittedAt,
  essayUrl,
  dueAt,
}: BuildEssaySubmittedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safeEssayTitle = escapeHtml(essayTitle);
  const safeSubmittedAt = escapeHtml(submittedAt);
  const safeDueAt = dueAt ? escapeHtml(dueAt) : null;

  return buildEmailLayout({
    eyebrow: "REDAÇÃO ENVIADA",
    title: `${safeFirstName}, recebemos sua redação!`,
    preheader: essaySubmittedEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Pronto: sua redação sobre <strong>${safeEssayTitle}</strong> foi enviada
        com sucesso e já entrou no nosso fluxo de correção.
      </p>

      <p style="margin: 0 0 16px 0;">
        Agora pode deixar com a gente. Seu texto vai passar por uma correção completa,
        competência por competência, para mostrar onde você mandou bem e onde ainda
        dá para ganhar pontos.
      </p>

      <p style="margin: 0;">
        Assim que a correção estiver pronta, a gente te avisa por e-mail.
      </p>
    `,

    action: {
      label: "Acompanhar minha redação",
      url: essayUrl,
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
                margin: 0 0 8px 0;
                color: #111827;
                font-size: 16px;
                font-weight: 700;
              "
            >
              Sua correção fica pronta em até 48 horas úteis
            </p>

            <p
              style="
                margin: 0 0 8px 0;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              Envio registrado em <strong>${safeSubmittedAt}</strong>.
            </p>

            ${
              safeDueAt
                ? `
                  <p
                    style="
                      margin: 0 0 8px 0;
                      color: #4b5563;
                      font-size: 13px;
                      line-height: 1.6;
                    "
                  >
                    Previsão de conclusão: <strong>${safeDueAt}</strong>.
                  </p>
                `
                : ""
            }

            <p
              style="
                margin: 0;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              Finais de semana e feriados nacionais não entram nessa contagem.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText: "Você recebeu este e-mail porque enviou uma redação para correção no Projeto 1000.",
  });
}

export function buildEssaySubmittedEmailText({
  firstName,
  essayTitle,
  submittedAt,
  essayUrl,
  dueAt,
}: BuildEssaySubmittedEmailParams) {
  return `Olá, ${firstName}!

Recebemos sua redação sobre "${essayTitle}" e ela já entrou no nosso fluxo de correção.

Agora pode deixar com a gente. Seu texto vai passar por uma correção completa, competência por competência, para mostrar onde você mandou bem e onde ainda dá para ganhar pontos.

Sua correção fica pronta em até 48 horas úteis.

Envio registrado em: ${submittedAt}
${dueAt ? `Previsão de conclusão: ${dueAt}\n` : ""}Finais de semana e feriados nacionais não entram nessa contagem.

Assim que a correção estiver pronta, a gente te avisa por e-mail.

Acompanhar minha redação:
${essayUrl}

Equipe Projeto 1000`;
}
