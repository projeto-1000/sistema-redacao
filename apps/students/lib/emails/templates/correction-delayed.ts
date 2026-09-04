import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildCorrectionDelayedEmailParams {
  firstName: string;
  essayTitle: string;
  essayUrl: string;
}

export const correctionDelayedEmail = {
  subject: "Sua correção está levando um pouco mais de tempo",
  preheader:
    "O prazo previsto da sua correção foi ultrapassado. Seu texto continua no nosso fluxo e estamos acompanhando.",
};

export function buildCorrectionDelayedEmailHtml({
  firstName,
  essayTitle,
  essayUrl,
}: BuildCorrectionDelayedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safeEssayTitle = escapeHtml(essayTitle);

  return buildEmailLayout({
    eyebrow: "ATUALIZAÇÃO DA CORREÇÃO",
    title: `${safeFirstName}, precisamos de um pouco mais de tempo`,
    preheader: correctionDelayedEmail.preheader,

    contentHtml: `
      <p style="margin:0 0 16px;">
        A correção da sua redação sobre <strong>${safeEssayTitle}</strong>
        ultrapassou o prazo previsto de 48 horas úteis.
      </p>

      <p style="margin:0 0 16px;">
        Sabemos que você está esperando pelo feedback e não queremos que fique sem uma atualização.
        Seu texto continua no nosso fluxo de correção e estamos acompanhando para que seja concluído o quanto antes.
      </p>

      <p style="margin:0;">
        Assim que a correção estiver pronta, você receberá um novo e-mail.
      </p>
    `,

    action: {
      label: "Acompanhar minha redação",
      url: essayUrl,
    },

    footerText:
      "Você recebeu este e-mail porque o prazo previsto de correção de uma redação enviada por você foi ultrapassado.",
  });
}

export function buildCorrectionDelayedEmailText({
  firstName,
  essayTitle,
  essayUrl,
}: BuildCorrectionDelayedEmailParams) {
  return `Olá, ${firstName}!

A correção da sua redação sobre "${essayTitle}" ultrapassou o prazo previsto de 48 horas úteis.

Seu texto continua no nosso fluxo de correção e estamos acompanhando para que seja concluído o quanto antes.

Assim que estiver pronta, você receberá um novo e-mail.

Acompanhar:
${essayUrl}

Equipe Projeto 1000`;
}
