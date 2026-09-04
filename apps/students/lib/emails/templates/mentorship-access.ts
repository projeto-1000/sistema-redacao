import { escapeHtml } from "../utils";

interface BuildMentorshipAccessEmailParams {
  signupUrl: string;
}

interface BuildMentorshipAccessEmailTextParams extends BuildMentorshipAccessEmailParams {
  buyerName: string | null;
}

export const mentorshipAccessEmail = {
  subject: "Seu acesso ao Projeto 1000 está liberado! 🚀",
};

export function buildMentorshipAccessEmailHtml({ signupUrl }: BuildMentorshipAccessEmailParams) {
  const safeSignupUrl = escapeHtml(signupUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Acesso liberado ao Projeto 1000</title>

  <style type="text/css">
    body, table, td, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

    body {
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #eaf3f9;
    }

    @media screen and (max-width: 600px) {
      .container {
        width: 90% !important;
        padding: 10px !important;
      }

      .content-box {
        padding: 30px 10px !important;
      }

      .text-center-mobile {
        text-align: center !important;
      }
    }
  </style>
</head>

<body style="background-color: #eaf3f9; margin: 0; padding: 0;">
  <table
    role="presentation"
    border="0"
    cellpadding="0"
    cellspacing="0"
    width="100%"
    style="background-color: #eaf3f9; padding: 40px 0;"
  >
    <tr>
      <td align="center">
        <table
          role="presentation"
          border="0"
          cellpadding="0"
          cellspacing="0"
          width="600"
          class="container"
          style="
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          "
        >
          <tr>
            <td
              align="center"
              style="padding: 20px 0 10px 0;"
              class="content-box"
            >
              <img
                src="https://kpaxpgjghrhklfmfbhay.supabase.co/storage/v1/object/sign/logos/logo-blue.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82ZmZjMGZhZi02NWVhLTQ5ODktOTIxMy0yZTBlOWM1MTk1YTMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvcy9sb2dvLWJsdWUucG5nIiwiaWF0IjoxNzc4MTgyOTc1LCJleHAiOjE5MzU4NjI5NzV9.N5DCVJv6FwrMDI8bSq6yuQY--gggJRvwkCxJf75DFx8"
                alt="Projeto 1000"
                width="180"
                style="
                  display: block;
                  border: 0;
                  max-width: 100%;
                  height: auto;
                  font-family: sans-serif;
                  font-size: 18px;
                  color: #111827;
                  font-weight: bold;
                "
              >
            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="padding: 20px 40px 40px 40px;"
              class="content-box"
            >
              <p
                style="
                  margin: 0 0 10px 0;
                  color: #0052d2;
                  font-size: 12px;
                  font-weight: 700;
                  letter-spacing: 1px;
                  text-transform: uppercase;
                "
              >
                BEM-VINDO(A)
              </p>

              <h1
                style="
                  margin: 0 20px 15px 20px;
                  color: #111827;
                  font-size: 28px;
                  font-weight: 800;
                  line-height: 1.2;
                "
              >
                Sua jornada rumo à nota 1000 começa agora!
              </h1>

              <p
                style="
                  margin: 0 0 30px 0;
                  color: #4b5563;
                  font-size: 14px;
                  line-height: 1.6;
                "
              >
                Sua conta já está ativa e com
                <strong>5 correções gratuitas</strong> para usar nas redações
                propostas durante a mentoria. A gente indica os temas, você
                coloca a mão na massa e recebe um diagnóstico completo para
                entender seus pontos fortes, saber onde melhorar e guiar seus
                estudos rumo à nota 1000.
              </p>

              <table
                role="presentation"
                border="0"
                cellpadding="0"
                cellspacing="0"
              >
                <tr>
                  <td
                    align="center"
                    style="border-radius: 8px;"
                    bgcolor="#f5a623"
                  >
                    <a
                      href="${safeSignupUrl}"
                      target="_blank"
                      style="
                        font-size: 14px;
                        font-weight: 700;
                        background-color: #F7C325;
                        color: #000;
                        text-decoration: none;
                        border-radius: 8px;
                        padding: 14px 28px;
                        display: inline-block;
                        border: 1px solid #f5a623;
                      "
                    >
                      Finalizar cadastro &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p
                style="
                  margin: 24px 0 0 0;
                  color: #6b7280;
                  font-size: 12px;
                  line-height: 1.6;
                "
              >
                Se o botão não funcionar, copie e cole este link no navegador:
              </p>

              <p
                style="
                  margin: 8px 0 0 0;
                  color: #2563eb;
                  font-size: 12px;
                  line-height: 1.6;
                  word-break: break-all;
                "
              >
                <a
                  href="${safeSignupUrl}"
                  target="_blank"
                  style="color: #2563eb;"
                >
                  ${safeSignupUrl}
                </a>
              </p>
            </td>
          </tr>

          <tr>
            <td
              align="left"
              style="padding: 10px 40px 30px 40px;"
              class="content-box"
            >
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
                        <td align="center" valign="top">
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

                  <td
                    valign="top"
                    style="padding-top: 6px; padding-bottom: 24px;"
                  >
                    <h4
                      style="
                        margin: 0 0 6px 0;
                        color: #111827;
                        font-size: 14px;
                        font-weight: 600;
                      "
                    >
                      Finalize seu cadastro
                    </h4>

                    <p
                      style="
                        margin: 0;
                        color: #4b5563;
                        font-size: 13px;
                        line-height: 1.6;
                      "
                    >
                      Confirme seus dados e crie sua senha. Para garantir a
                      liberação correta do acesso, utilize o mesmo e-mail
                      informado na compra pela Hotmart.
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
                        <td align="center" valign="top">
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

                  <td
                    valign="top"
                    style="padding-top: 6px; padding-bottom: 24px;"
                  >
                    <h4
                      style="
                        margin: 0 0 6px 0;
                        color: #111827;
                        font-size: 14px;
                        font-weight: 600;
                      "
                    >
                      Receba seus 5 créditos
                    </h4>

                    <p
                      style="
                        margin: 0;
                        color: #4b5563;
                        font-size: 13px;
                        line-height: 1.6;
                      "
                    >
                      Assim que o cadastro for concluído, os 5 créditos para
                      correção serão liberados na sua conta.
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

                      <tr>
                        <td align="center" valign="top">
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

                  <td
                    valign="top"
                    style="padding-top: 6px; padding-bottom: 24px;"
                  >
                    <h4
                      style="
                        margin: 0 0 6px 0;
                        color: #111827;
                        font-size: 14px;
                        font-weight: 600;
                      "
                    >
                      Siga os temas da mentoria
                    </h4>

                    <p
                      style="
                        margin: 0;
                        color: #4b5563;
                        font-size: 13px;
                        line-height: 1.6;
                      "
                    >
                      Durante a mentoria, vamos indicar os temas que você deverá
                      desenvolver. É hora de colocar a mão na massa e praticar
                      com direcionamento.
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
                          4
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
                      Envie e acompanhe sua evolução
                    </h4>

                    <p
                      style="
                        margin: 0;
                        color: #4b5563;
                        font-size: 13px;
                        line-height: 1.6;
                      "
                    >
                      Use seus créditos para enviar as redações propostas e
                      receber um diagnóstico completo, entender seus pontos
                      fortes, descobrir onde melhorar e guiar seus estudos rumo
                      à nota 1000.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="padding: 0 40px 40px 40px;"
              class="content-box"
            >
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
                  overflow: hidden;
                "
              >
                <tr>
                  <td
                    style="padding: 24px 28px; text-align: left;"
                    class="text-center-mobile"
                  >
                    <p
                      style="
                        margin: 0 0 8px 0;
                        color: #9a6700;
                        font-size: 11px;
                        font-weight: 700;
                        letter-spacing: 0.8px;
                        text-transform: uppercase;
                      "
                    >
                      Aproveite bem seus créditos
                    </p>

                    <h3
                      style="
                        margin: 0 0 10px 0;
                        color: #111827;
                        font-size: 16px;
                        font-weight: 700;
                      "
                    >
                      Cada redação faz parte da sua evolução
                    </h3>

                    <p
                      style="
                        margin: 0;
                        color: #4b5563;
                        font-size: 12px;
                        line-height: 1.6;
                      "
                    >
                      Cada envio para correção utiliza 1 crédito. Por isso,
                      fique de olho nas orientações da mentoria e use seus
                      créditos nos temas indicados para aproveitar ao máximo
                      cada feedback.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="padding: 0 40px; margin: 10px 10px;"
            >
              <p
                style="
                  margin-bottom: 10px;
                  color: #6b7280;
                  font-size: 10px;
                  font-weight: 600;
                  text-transform: uppercase;
                  border-top: 1px solid #e5e7eb;
                  padding-top: 14px;
                "
              >
                &copy; 2026 Projeto 1000 - Todos os direitos reservados.
              </p>

              <p
                style="
                  margin-bottom: 20px;
                  color: #9ca3af;
                  font-size: 10px;
                  line-height: 1.5;
                "
              >
                Você recebeu este e-mail porque sua compra da mentoria foi
                aprovada na Hotmart. Se você não reconhece essa compra, ignore
                esta mensagem.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildMentorshipAccessEmailText({
  buyerName,
  signupUrl,
}: BuildMentorshipAccessEmailTextParams) {
  const displayName = buyerName?.trim() || "Aluno(a)";

  return `Olá, ${displayName}!

Sua jornada rumo à nota 1000 começa agora!

Ao finalizar seu cadastro, você receberá 5 créditos para usar nas redações propostas durante a mentoria.

Durante a mentoria, vamos indicar os temas que você deverá desenvolver. Você coloca a mão na massa, envia sua redação pela plataforma e recebe um diagnóstico completo para entender seus pontos fortes, saber onde melhorar e guiar seus estudos rumo à nota 1000.

Para finalizar seu cadastro, acesse:

${signupUrl}

Importante: use o mesmo e-mail informado na compra pela Hotmart.

Cada envio para correção utiliza 1 crédito. Por isso, use seus créditos nos temas indicados durante a mentoria para aproveitar ao máximo cada feedback.

Se você não reconhece essa compra, ignore este e-mail.

Equipe Projeto 1000`;
}
