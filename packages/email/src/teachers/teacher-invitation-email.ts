import "server-only";

interface TeacherInvitationParams {
  teacherName: string;
  signupUrl: string;
}

export const teacherInvitationEmail = {
  subject: "Seu convite para o Projeto 1000 chegou",
  preheader: "Seu cadastro como professor já foi criado. Falta só definir sua senha para acessar a plataforma.",
};

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function buildTeacherInvitationEmailHtml({ teacherName, signupUrl }: TeacherInvitationParams) {
  const name = escapeHtml(teacherName);
  const url = escapeHtml(signupUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${teacherInvitationEmail.subject}</title></head>
<body style="margin:0;background:#f5f8ff;font-family:Arial,Helvetica,sans-serif;color:#172033">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden">${teacherInvitationEmail.preheader}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:36px 16px">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#fff;border:1px solid #e1e8f5;border-radius:18px">
      <tr><td style="padding:32px 36px 12px"><p style="margin:0;color:#1858d6;font-size:22px;font-weight:800">Projeto 1000</p></td></tr>
      <tr><td style="padding:12px 36px 36px">
        <p style="margin:0 0 12px;color:#1d4ed8;font-size:11px;font-weight:700;letter-spacing:.8px">BEM-VINDO(A) AO PROJETO 1000</p>
        <h1 style="margin:0 0 24px;font-size:28px;line-height:1.25">${name}, seu acesso está quase pronto</h1>
        <p style="margin:0 0 16px;line-height:1.6">Você foi convidado(a) para fazer parte do time de professores do Projeto 1000.</p>
        <p style="margin:0 0 16px;line-height:1.6">Seu cadastro já foi criado pela nossa equipe. Agora falta apenas definir sua senha para acessar a plataforma e começar a acompanhar as redações disponíveis para correção.</p>
        <p style="margin:0 0 28px;line-height:1.6">Clique no botão abaixo para finalizar seu acesso.</p>
        <a href="${url}" style="display:inline-block;background:#1759e8;border-radius:9px;color:#fff;text-decoration:none;font-weight:700;padding:15px 24px">Criar minha senha</a>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:32px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px"><tr><td style="padding:22px 24px">
          <p style="margin:0 0 6px;color:#1d4ed8;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase">O que acontece depois?</p>
          <p style="margin:0;color:#4b5563;font-size:13px;line-height:1.6">Assim que criar sua senha, você já poderá entrar na plataforma de professores e acessar seu ambiente de correção.</p>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:22px 36px;border-top:1px solid #e1e8f5;color:#64748b;font-size:12px;line-height:1.5">Você recebeu este e-mail porque um administrador do Projeto 1000 criou seu cadastro como professor. Se você não reconhece este convite, pode ignorar esta mensagem.</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export function buildTeacherInvitationEmailText({ teacherName, signupUrl }: TeacherInvitationParams) {
  return `Olá, ${teacherName}!

Seu acesso ao Projeto 1000 está quase pronto.

Você foi convidado(a) para fazer parte do time de professores do Projeto 1000.

Seu cadastro já foi criado pela nossa equipe. Agora falta apenas definir sua senha para acessar a plataforma e começar a acompanhar as redações disponíveis para correção.

Crie sua senha aqui:
${signupUrl}

Assim que finalizar, você já poderá acessar seu ambiente de professor.

Equipe Projeto 1000`;
}

export async function sendTeacherInvitationEmail({ to, teacherName, signupUrl }: TeacherInvitationParams & { to: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Teacher invitation email is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: teacherInvitationEmail.subject,
      html: buildTeacherInvitationEmailHtml({ teacherName, signupUrl }),
      text: buildTeacherInvitationEmailText({ teacherName, signupUrl }),
    }),
  });

  if (!response.ok) throw new Error(`Teacher invitation email failed with status ${response.status}.`);
}
