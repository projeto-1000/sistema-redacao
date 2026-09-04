import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildOrganicWelcomeEmailParams {
  firstName: string;
  dashboardUrl: string;
  freeCredits: number;
  creditsExpireAt: string;
}

export const organicWelcomeEmail = {
  subject: "Seu primeiro passo rumo à nota 1000 começa aqui 🚀",
  preheader: "Seu acesso ao Projeto 1000 está liberado — e você já tem crédito para começar.",
};

export function buildOrganicWelcomeEmailHtml({
  firstName,
  dashboardUrl,
  freeCredits,
  creditsExpireAt,
}: BuildOrganicWelcomeEmailParams) {
  const safeFirstName = escapeHtml(firstName);
  const safeCreditsExpireAt = escapeHtml(creditsExpireAt);

  return buildEmailLayout({
    eyebrow: "BEM-VINDO(A)",
    title: "Sua jornada rumo à nota 1000 começa agora!",
    preheader: organicWelcomeEmail.preheader,

    contentHtml: `
  <p style="margin: 0 0 16px 0;">
    Sua conta está pronta e você já tem
    <strong>${freeCredits} crédito gratuito</strong> para começar.
  </p>

  <p style="margin: 0 0 16px 0;">
    Com ele, você pode enviar sua primeira redação e receber uma correção
    completa para entender seus pontos fortes, identificar onde está perdendo
    pontos e saber exatamente no que focar para evoluir.
  </p>

  <p style="margin: 0;">
    Escolha um tema, escreva sua redação e deixe que a gente te ajuda no próximo passo.
  </p>
`,

    action: {
      label: "Enviar minha primeira redação",
      url: dashboardUrl,
    },

    extraContentHtml: `
  <h3
    style="
      margin: 0 0 20px 0;
      color: #111827;
      font-size: 16px;
      font-weight: 700;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
    "
  >
    Como funciona
  </h3>

  <table
    role="presentation"
    border="0"
    cellpadding="0"
    cellspacing="0"
    width="100%"
  >
    <tr>
      <td width="32" valign="top" align="center">
        <table
          role="presentation"
          border="0"
          cellpadding="0"
          cellspacing="0"
          width="32"
        >
          <tr>
            <td
              align="center"
              valign="middle"
              style="
                background-color: #eff6ff;
                color: #2563eb;
                border: 1px solid #bfdbfe;
                width: 32px;
                height: 32px;
                border-radius: 16px;
                font-weight: 700;
                font-size: 13px;
                line-height: 1;
              "
            >
              1
            </td>
          </tr>

          <tr>
            <td align="center">
              <div
                style="
                  width: 2px;
                  height: 45px;
                  background-color: #bfdbfe;
                  margin: 4px 0;
                "
              ></div>
            </td>
          </tr>
        </table>
      </td>

      <td width="16"></td>

      <td valign="top" style="padding-top: 6px; padding-bottom: 24px;">
        <h4
          style="
            margin: 0 0 6px 0;
            color: #111827;
            font-size: 14px;
            font-weight: 600;
          "
        >
          Escolha um tema
        </h4>

        <p
          style="
            margin: 0;
            color: #4b5563;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          Acesse nossa lista de propostas e escolha um tema para desenvolver sua redação.
        </p>
      </td>
    </tr>

    <tr>
      <td width="32" valign="top" align="center">
        <table
          role="presentation"
          border="0"
          cellpadding="0"
          cellspacing="0"
          width="32"
        >
          <tr>
            <td
              align="center"
              valign="middle"
              style="
                background-color: #eff6ff;
                color: #2563eb;
                border: 1px solid #bfdbfe;
                width: 32px;
                height: 32px;
                border-radius: 16px;
                font-weight: 700;
                font-size: 13px;
                line-height: 1;
              "
            >
              2
            </td>
          </tr>

          <tr>
            <td align="center">
              <div
                style="
                  width: 2px;
                  height: 45px;
                  background-color: #bfdbfe;
                  margin: 4px 0;
                "
              ></div>
            </td>
          </tr>
        </table>
      </td>

      <td width="16"></td>

      <td valign="top" style="padding-top: 6px; padding-bottom: 24px;">
        <h4
          style="
            margin: 0 0 6px 0;
            color: #111827;
            font-size: 14px;
            font-weight: 600;
          "
        >
          Envie sua redação
        </h4>

        <p
          style="
            margin: 0;
            color: #4b5563;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          Use seu crédito gratuito para enviar o texto pela plataforma.
        </p>
      </td>
    </tr>

    <tr>
      <td width="32" valign="top" align="center">
        <table
          role="presentation"
          border="0"
          cellpadding="0"
          cellspacing="0"
          width="32"
        >
          <tr>
            <td
              align="center"
              valign="middle"
              style="
                background-color: #eff6ff;
                color: #2563eb;
                border: 1px solid #bfdbfe;
                width: 32px;
                height: 32px;
                border-radius: 16px;
                font-weight: 700;
                font-size: 13px;
                line-height: 1;
              "
            >
              3
            </td>
          </tr>
        </table>
      </td>

      <td width="16"></td>

      <td valign="top" style="padding-top: 6px;">
        <h4
          style="
            margin: 0 0 6px 0;
            color: #111827;
            font-size: 14px;
            font-weight: 600;
          "
        >
          Receba sua correção
        </h4>

        <p
          style="
            margin: 0;
            color: #4b5563;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          Veja sua nota por competência, os comentários da correção e os próximos
          passos para evoluir na próxima redação.
        </p>
      </td>
    </tr>
  </table>

  <table
    role="presentation"
    border="0"
    cellpadding="0"
    cellspacing="0"
    width="100%"
    style="
      margin-top: 28px;
      background-color: #fff8e6;
      border-radius: 12px;
      border: 1px solid #f7c325;
    "
  >
    <tr>
      <td style="padding: 22px 24px;">
        <p
          style="
            margin: 0 0 6px 0;
            color: #9a6700;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.8px;
            text-transform: uppercase;
          "
        >
          Aproveite seu crédito gratuito
        </p>

        <p
          style="
            margin: 0;
            color: #4b5563;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          Ele fica disponível até <strong>${safeCreditsExpireAt}</strong>.
          Depois dessa data, o crédito expira.
        </p>
      </td>
    </tr>
  </table>
`,

    footerText: "Você recebeu este e-mail porque criou uma conta no Projeto 1000.",
  });
}

export function buildOrganicWelcomeEmailText({
  firstName,
  dashboardUrl,
  freeCredits,
  creditsExpireAt,
}: BuildOrganicWelcomeEmailParams) {
  return `Olá, ${firstName}!

Seu acesso ao Projeto 1000 está liberado! 💙

E você não precisa esperar para começar: sua conta já tem ${freeCredits} crédito gratuito para enviar sua primeira redação e descobrir, na prática, o que está te aproximando — ou te afastando — da nota 1000.

Depois da correção, você recebe muito mais do que uma nota: mostramos seus pontos fortes, onde você está perdendo pontos e o que precisa fazer para evoluir na próxima.

Seu crédito gratuito fica disponível até ${creditsExpireAt}.

Então aproveita para escolher um tema, colocar suas ideias no papel e dar o primeiro passo na sua evolução.

Enviar minha primeira redação:
${dashboardUrl}

Equipe Projeto 1000`;
}
