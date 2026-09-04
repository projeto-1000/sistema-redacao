import { buildEmailLayout } from "../components/email-layout";
import { escapeHtml } from "../utils";

interface BuildPasswordChangedEmailParams {
  loginUrl: string;
}

export const passwordChangedEmail = {
  subject: "Sua senha do Projeto 1000 foi alterada",
  preheader: "A alteração da senha da sua conta foi concluída com sucesso.",
};

export function buildPasswordChangedEmailHtml({ loginUrl }: BuildPasswordChangedEmailParams) {
  return buildEmailLayout({
    eyebrow: "SEGURANÇA DA CONTA",
    title: "Senha alterada com sucesso",
    preheader: passwordChangedEmail.preheader,

    contentHtml: `
  <p style="margin: 0 0 16px 0;">
    A senha da sua conta no <strong>Projeto 1000</strong> foi alterada com sucesso.
  </p>

  <p style="margin: 0;">
    Se você fez essa alteração, não precisa realizar nenhuma outra ação.
    No próximo acesso, utilize a nova senha.
  </p>
`,

    action: {
      label: "Acessar minha conta",
      url: loginUrl,
    },

    extraContentHtml: `
  <table
    role="presentation"
    border="0"
    cellpadding="0"
    cellspacing="0"
    width="100%"
    style="
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
          Não reconhece essa alteração?
        </p>

        <p
          style="
            margin: 0;
            color: #4b5563;
            font-size: 13px;
            line-height: 1.6;
          "
        >
          Se você não alterou sua senha, redefina o acesso à sua conta
          imediatamente.
        </p>
      </td>
    </tr>
  </table>
`,

    footerText:
      "Você recebeu este e-mail porque a senha da sua conta no Projeto 1000 foi alterada.",
  });
}

export function buildPasswordChangedEmailText({ loginUrl }: BuildPasswordChangedEmailParams) {
  return `
A senha da sua conta no Projeto 1000 foi alterada com sucesso.

Se foi você quem fez essa alteração, não precisa fazer mais nada. Seu próximo acesso já deve ser feito com a nova senha.

Acessar minha conta:
${loginUrl}

Não reconhece essa alteração?

Se você não trocou sua senha, recomendamos recuperar o acesso à conta imediatamente e criar uma nova senha.

Equipe Projeto 1000`;
}
