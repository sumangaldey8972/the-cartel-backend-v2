const BRAND_LOGO_CID = "cartel-brand-logo";
const BRAND_MARK_CID = "cartel-brand-mark";

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

export function renderVerificationEmail({ firstName, otp }) {
  const safeName = escapeHtml(firstName);
  const safeOtp = escapeHtml(otp);
  const otpCells = [...safeOtp]
    .map((digit) => `
      <td width="68" align="center" bgcolor="#d8ff4f" class="otp-cell" style="width:68px;height:72px;border:1px solid #151713;font-family:'Courier New',Courier,monospace;font-size:36px;line-height:72px;font-weight:700;color:#151713;">
        ${digit}
      </td>`)
    .join('<td width="8" class="otp-gap" style="width:8px;font-size:0;line-height:0;">&nbsp;</td>');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <title>Verify your email</title>
    <style>
      @media only screen and (max-width: 620px) {
        .email-shell { width: 100% !important; }
        .mobile-pad { padding-left: 16px !important; padding-right: 16px !important; }
        .brand-logo { width: 182px !important; height: 77px !important; }
        .header-tagline { display: none !important; }
        .email-title { font-size: 38px !important; }
        .otp-cell { width: 42px !important; height: 54px !important; font-size: 28px !important; line-height: 54px !important; }
        .otp-gap { width: 4px !important; }
        .meta-copy { font-size: 8px !important; letter-spacing: 1px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#ece9e1;color:#151713;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your The Cartel verification code is ${safeOtp}. It expires in 5 minutes.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ece9e1" style="width:100%;background:#ece9e1;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" class="email-shell" style="width:100%;max-width:640px;border-collapse:collapse;border:1px solid #d8d4ca;">
            <tr>
              <td bgcolor="#151713" class="mobile-pad" style="background:#151713;padding:18px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="left" valign="middle" style="width:62%;">
                      <img src="cid:${BRAND_LOGO_CID}" width="228" height="96" alt="THE CARTEL.AI" class="brand-logo" style="display:block;width:228px;height:96px;border:0;outline:none;text-decoration:none;">
                    </td>
                    <td align="right" valign="middle" class="header-tagline" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;letter-spacing:2px;text-transform:uppercase;color:#b9bbb4;">
                      Market intelligence,<br>without the noise.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="#fbf8ef" class="mobile-pad" style="background:#fbf8ef;padding:24px 28px 34px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="border-top:1px solid #151713;border-bottom:1px solid #151713;padding:11px 0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                        <tr>
                          <td align="left" class="meta-copy" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.2;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#151713;">Dispatch 01</td>
                          <td align="center" class="meta-copy" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.2;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#151713;">Account verification</td>
                          <td align="right" class="meta-copy" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.2;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#151713;">Valid 5 min</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:38px 0 0;">
                      <img src="cid:${BRAND_MARK_CID}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;margin:0 auto;border:0;outline:none;text-decoration:none;">
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.3;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#151713;">Private Security Briefing</td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:24px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.35;color:#151713;">Hi ${safeName},</td>
                  </tr>
                  <tr>
                    <td align="center" class="email-title" style="padding:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:48px;line-height:1.08;font-weight:400;color:#151713;">Verify your email</td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:14px 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#5f625c;">Use this verification code to finish creating your account.</td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:28px 0 0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                        <tr>${otpCells}
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:18px 0 30px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#5f625c;">This code expires in 5 minutes.</td>
                  </tr>
                  <tr>
                    <td style="border-top:1px solid #151713;border-bottom:1px solid #151713;padding:20px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#5f625c;">Never share this code. If you didn&rsquo;t create this account, you can safely ignore this email.</td>
                  </tr>
                  <tr>
                    <td style="padding:24px 2px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;color:#686b65;">
                      <strong style="font-size:12px;letter-spacing:1.5px;color:#151713;">THE CARTEL</strong><sup style="font-size:7px;color:#686b65;">.AI</sup><br>
                      Market intelligence, without the noise.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export { BRAND_LOGO_CID, BRAND_MARK_CID };
