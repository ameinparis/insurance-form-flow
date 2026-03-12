module.exports = ({
  greeting,
  message,
  ctaText,
  ctaUrl,
  footerNote,
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="
  margin:0;
  padding:40px 0;
  background-color:#ffffff;
  font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color:#1f2937;
">

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="
          border:1px solid #e5e7eb;
          padding:48px;
        ">

          <!-- Greeting -->
          <tr>
            <td style="font-size:28px; font-weight:300; padding-bottom:32px;">
              ${greeting}
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="font-size:18px; line-height:1.6; padding-bottom:40px;">
              ${message}
            </td>
          </tr>

          <!-- CTA -->
          ${
            ctaUrl
              ? `<tr>
                  <td align="center" style="padding-bottom:40px;">
                    <a href="${ctaUrl}"
                      style="
                        display:inline-block;
                        background-color:#3b82f6;
                        color:#ffffff;
                        text-decoration:none;
                        padding:14px 32px;
                        font-size:16px;
                        border-radius:4px;
                      ">
                      ${ctaText}
                    </a>
                  </td>
                </tr>`
              : ""
          }

          <!-- Footer -->
          <tr>
            <td style="font-size:14px; color:#6b7280; line-height:1.6;">
              ${footerNote || ""}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;
