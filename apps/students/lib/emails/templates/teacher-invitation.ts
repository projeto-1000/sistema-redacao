import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildTeacherInvitationEmailParams {
  teacherName: string;
  signupUrl: string;
}

export const teacherInvitationEmail = {
  subject: "Seu convite para o Projeto 1000 chegou",
  preheader:
    "Seu cadastro como professor já foi criado. Falta só definir sua senha para acessar a plataforma.",
};

export function buildTeacherInvitationEmailHtml({
  teacherName,
  signupUrl,
}: BuildTeacherInvitationEmailParams) {
  const safeTeacherName = escapeHtml(teacherName);

  return buildEmailLayout({
    eyebrow: "BEM-VINDO(A) AO PROJETO 1000",
    title: `${safeTeacherName}, seu acesso está quase pronto`,
    preheader: teacherInvitationEmail.preheader,

    contentHtml: `
      <p style="margin: 0 0 16px 0;">
        Você foi convidado(a) para fazer parte do time de professores do Projeto 1000.
      </p>

      <p style="margin: 0 0 16px 0;">
        Seu cadastro já foi criado pela nossa equipe. Agora falta apenas definir sua senha para acessar a plataforma e começar a acompanhar as redações disponíveis para correção.
      </p>

      <p style="margin: 0;">
        Clique no botão abaixo para finalizar seu acesso.
      </p>
    `,

    action: {
      label: "Criar minha senha",
      url: signupUrl,
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
              O que acontece depois?
            </p>

            <p
              style="
                margin: 0;
                color: #4b5563;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              Assim que criar sua senha, você já poderá entrar na plataforma de professores e acessar seu ambiente de correção.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Você recebeu este e-mail porque um administrador do Projeto 1000 criou seu cadastro como professor. Se você não reconhece este convite, pode ignorar esta mensagem.",
  });
}

export function buildTeacherInvitationEmailText({
  teacherName,
  signupUrl,
}: BuildTeacherInvitationEmailParams) {
  return `Olá, ${teacherName}!

Seu acesso ao Projeto 1000 está quase pronto.

Você foi convidado(a) para fazer parte do time de professores do Projeto 1000.

Seu cadastro já foi criado pela nossa equipe. Agora falta apenas definir sua senha para acessar a plataforma e começar a acompanhar as redações disponíveis para correção.

Crie sua senha aqui:
${signupUrl}

Assim que finalizar, você já poderá acessar seu ambiente de professor.

Equipe Projeto 1000`;
}
