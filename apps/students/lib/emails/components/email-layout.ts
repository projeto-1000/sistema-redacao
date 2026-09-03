interface EmailAction {
  label: string;
  url: string;
}

interface BuildEmailLayoutParams {
  title: string;
  eyebrow?: string;
  contentHtml: string;
  action?: EmailAction;
  footerText: string;
  preheader?: string;
  extraContentHtml?: string;
}

const PROJECT_1000_LOGO_URL =
  "https://kpaxpgjghrhklfmfbhay.supabase.co/storage/v1/object/sign/logos/logo-blue.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82ZmZjMGZhZi02NWVhLTQ5ODktOTIxMy0yZTBlOWM1MTk1YTMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvcy9sb2dvLWJsdWUucG5nIiwiaWF0IjoxNzc4MTgyOTc1LCJleHAiOjE5MzU4NjI5NzV9.N5DCVJv6FwrMDI8bSq6yuQY--gggJRvwkCxJf75DFx8";

function renderPreheader(preheader?: string) {
  if (!preheader) {
    return "";
  }

  return `
    <div
      style="
        display: none;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        color: transparent;
        mso-hide: all;
      "
    >
      ${preheader}
    </div>
  `;
}

function renderAction(action?: EmailAction) {
  if (!action) {
    return "";
  }

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="border-radius: 8px;" bgcolor="#F7C325">
          <a
            href="${action.url}"
            target="_blank"
            style="
              font-size: 14px;
              font-weight: 700;
              background-color: #F7C325;
              color: #000000;
              text-decoration: none;
              border-radius: 8px;
              padding: 14px 28px;
              display: inline-block;
              border: 1px solid #f5a623;
            "
          >
            ${action.label} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function buildEmailLayout({
  title,
  eyebrow,
  contentHtml,
  action,
  footerText,
  preheader,
  extraContentHtml,
}: BuildEmailLayoutParams) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>

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
      }

      .content-box {
        padding-left: 24px !important;
        padding-right: 24px !important;
      }
    }
  </style>
</head>

<body style="background-color: #eaf3f9; margin: 0; padding: 0;">
  ${renderPreheader(preheader)}

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
            width: 600px;
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          "
        >
          <tr>
            <td align="center" style="padding: 24px 0 12px 0;">
              <img
                src="${PROJECT_1000_LOGO_URL}"
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
              class="content-box"
              style="padding: 24px 40px 40px 40px;"
            >
              ${
                eyebrow
                  ? `
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
                      ${eyebrow}
                    </p>
                  `
                  : ""
              }

              <h1
                style="
                  margin: 0 0 16px 0;
                  color: #111827;
                  font-size: 28px;
                  font-weight: 800;
                  line-height: 1.2;
                "
              >
                ${title}
              </h1>

              <div
                style="
                  color: #4b5563;
                  font-size: 14px;
                  line-height: 1.7;
                "
              >
                ${contentHtml}
              </div>

              ${
                action
                  ? `
                    <div style="height: 28px; line-height: 28px;">&nbsp;</div>
                    ${renderAction(action)}
                  `
                  : ""
              }
            </td>
          </tr>

          ${
            extraContentHtml
              ? `
                <tr>
                  <td
                    class="content-box"
                    style="padding: 0 40px 40px 40px;"
                  >
                    ${extraContentHtml}
                  </td>
                </tr>
              `
              : ""
          }

          <tr>
            <td
              align="center"
              class="content-box"
              style="padding: 0 40px 24px 40px;"
            >
              <p
                style="
                  margin: 0 0 10px 0;
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
                  margin: 0;
                  color: #9ca3af;
                  font-size: 10px;
                  line-height: 1.5;
                "
              >
                ${footerText}
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
