import nodemailer from "nodemailer";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { BRAND_LOGO_CID, BRAND_MARK_CID, renderVerificationEmail } from "../templates/verification-email.template.js";

const transporterCacheKey = "__cartelEmailTransporter";

function getTransporter() {
  if (!globalThis[transporterCacheKey]) {
    globalThis[transporterCacheKey] = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return globalThis[transporterCacheKey];
}

const brandLogoPath = fileURLToPath(new URL("../assets/cartel-email-logo.png", import.meta.url));
const brandMarkPath = fileURLToPath(new URL("../assets/cartel-email-mark.png", import.meta.url));

export async function sendVerificationOtp({ email, firstName, otp }) {
  const subject = `${otp} is your The Cartel verification code`;

  await getTransporter().sendMail({
    from: env.smtp.from,
    to: email,
    subject,
    text: `Hi ${firstName},\n\nYour The Cartel verification code is ${otp}. It expires in 5 minutes. Never share this code with anyone.\n\nIf you did not create this account, you can ignore this email.`,
    html: renderVerificationEmail({ firstName, otp }),
    attachments: [
      {
        filename: "the-cartel-logo.png",
        path: brandLogoPath,
        cid: BRAND_LOGO_CID,
        contentDisposition: "inline",
      },
      {
        filename: "the-cartel-mark.png",
        path: brandMarkPath,
        cid: BRAND_MARK_CID,
        contentDisposition: "inline",
      },
    ],
  });
}
