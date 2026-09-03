import { buildEmailLayout } from "../components/email-layout";

interface BuildAccountDeletedEmailParams {
  deletedAt: string;
  projectUrl: string;
}

export const accountDeletedEmail = {
  subject: "Sua conta do Projeto 1000 foi excluída",
  preheader: "O processo de exclusão da sua conta foi concluído.",
};

export function buildAccountDeletedEmailHtml({
  deletedAt,
  projectUrl,
}: BuildAccountDeletedEmailParams) {
  return buildEmailLayout({
    eyebrow: "CONTA EXCLUÍDA",
    title: "Sua conta foi excluída",
    preheader: accountDeletedEmail.preheader,

    contentHtml: `
      <p style="margin:0 0 16px;">
        O processo de exclusão da sua conta no
        <strong>Projeto 1000</strong> foi concluído.
      </p>

      <p style="margin:0;">
        Obrigado por ter feito parte da nossa jornada.
        Se algum dia quiser voltar, será muito bem-vindo(a). 💙
      </p>
    `,

    action: {
      label: "Conhecer o Projeto 1000",
      url: projectUrl,
    },

    extraContentHtml: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background-color:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
        <tr>
          <td style="padding:22px 24px;">
            <p style="margin:0;color:#4b5563;font-size:13px;">
              Exclusão concluída em <strong>${deletedAt}</strong>.
            </p>
          </td>
        </tr>
      </table>
    `,

    footerText:
      "Este é um e-mail de confirmação referente à exclusão da sua conta no Projeto 1000.",
  });
}

export function buildAccountDeletedEmailText({
  deletedAt,
  projectUrl,
}: BuildAccountDeletedEmailParams) {
  return `Sua conta do Projeto 1000 foi excluída.

Exclusão concluída em ${deletedAt}.

Obrigado por ter feito parte da nossa jornada.

${projectUrl}

Equipe Projeto 1000`;
}
