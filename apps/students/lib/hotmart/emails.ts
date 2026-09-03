import {
  buildMentorshipAccessEmailHtml,
  buildMentorshipAccessEmailText,
  mentorshipAccessEmail,
} from "@/lib/emails/templates/mentorship-access";
import { createResendClient, getResendFromEmail } from "@/lib/resend";

interface SendHotmartMentorshipAccessEmailParams {
  to: string;
  buyerName: string | null;
  signupToken: string;
}

function getStudentsAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_STUDENTS_APP_URL;

  if (!appUrl) {
    throw new Error("Missing NEXT_PUBLIC_STUDENTS_APP_URL.");
  }

  return appUrl.replace(/\/$/, "");
}

function buildMentorshipSignupUrl(signupToken: string) {
  const appUrl = getStudentsAppUrl();

  return `${appUrl}/cadastro?token=${encodeURIComponent(signupToken)}`;
}

export async function sendHotmartMentorshipAccessEmail({
  to,
  buyerName,
  signupToken,
}: SendHotmartMentorshipAccessEmailParams) {
  const resend = createResendClient();
  const from = getResendFromEmail();

  const signupUrl = buildMentorshipSignupUrl(signupToken);

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: mentorshipAccessEmail.subject,
    text: buildMentorshipAccessEmailText({
      buyerName,
      signupUrl,
    }),
    html: buildMentorshipAccessEmailHtml({
      signupUrl,
    }),
  });

  if (error) {
    console.error("[HOTMART_MENTORSHIP_EMAIL_ERROR]", {
      to,
      error,
    });

    throw new Error("Não foi possível enviar o e-mail de acesso da mentoria.");
  }

  return data;
}
