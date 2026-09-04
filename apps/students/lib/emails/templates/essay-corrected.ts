import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildEssayCorrectedEmailParams {
  firstName: string;
  essayTitle: string;
  score: number;
  correctionUrl: string;
}

export const essayCorrectedEmail = {
  subject: "Sua correção chegou! ✨",
  preheader:
    "Sua redação já foi corrigida. Veja seu desempenho, seus pontos fortes e onde dá para evoluir.",
};

export function buildEssayCorrectedEmailHtml({
  firstName,
  essayTitle,
  score,
  correctionUrl,
}: BuildEssayCorrectedEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safeEssayTitle = escapeHtml(essayTitle);

  return buildEmailLayout({
    eyebrow: "CORREÇÃO CONCLUÍDA",
    title: `${safeFirstName}, sua correção está pronta!`,
    preheader: essayCorrectedEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Sua redação sobre <strong>${safeEssayTitle}</strong> já foi corrigida, e a análise completa está te esperando.
      </p>

      <p style="margin: 0 0 16px 0;">
        Tenha especial atenção ao principal gargalo identificado e aos próximos passos previstos. Além disso, a correção traz tarefas de reescrita, caso você queira praticar imediatamente.
      </p>

      <p style="margin: 0;">
        Lembre-se: a nota é importante, mas o mais valioso é o caminho para melhorar cada vez mais.
      </p>
    `,

    action: {
      label: "Ver minha correção",
      url: correctionUrl,
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
              Seu resultado
            </p>

            <p
              style="
                margin: 0 0 8px 0;

                font-size: 22px;
                font-weight: 800;
              "
            >
              Quer ver seu resultado?
            </p>

            <p
              style="
                margin: 0;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.6;
              "
            >
             Na plataforma, você encontra a análise completa das competências, o seu principal gargalo, os próximos passos e suas tarefas de reescrita.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque uma redação enviada por você foi corrigida no Projeto 1000.",
  });
}

export function buildEssayCorrectedEmailText({
  firstName,
  essayTitle,
  score,
  correctionUrl,
}: BuildEssayCorrectedEmailParams) {
  return `Olá, ${firstName}!

Sua correção está pronta!

A redação sobre "${essayTitle}" já foi corrigida e o feedback completo está te esperando.

Sua nota: ${score} pontos.

Agora é a hora de olhar com calma para o que funcionou, entender onde você perdeu pontos e transformar essa correção em estratégia para a próxima redação.

Na plataforma, você encontra a análise completa das competências, os comentários da correção e os próximos passos para evoluir.

Ver minha correção:
${correctionUrl}

Equipe Projeto 1000`;
}
