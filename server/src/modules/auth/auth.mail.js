// Sends the OTP email. In development the code is ALSO printed in the server console,
// so nobody needs email set up to test signup.
import nodemailer from "nodemailer";
import { LIMITS } from "@realestate/shared";
import { env } from "../../config/env.js";

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

const SUBJECT = "Your Aawas verification code";

function textBody(code) {
  return [
    `Your Aawas verification code is ${code}.`,
    "",
    `It expires in ${LIMITS.OTP_EXPIRY_MINUTES} minutes.`,
    "If you did not sign up for Aawas, you can ignore this email.",
  ].join("\n");
}

// Plain inline styles only: email apps ignore <style> blocks and most CSS.
function htmlBody(code) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#faf8f3;font-family:Arial,Helvetica,sans-serif;color:#16201d">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e8e3d8;border-radius:16px">
      <tr>
        <td style="padding:28px 28px 8px">
          <p style="margin:0;font-size:20px;font-weight:bold;color:#0e2a23">Aawas</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 28px">
          <p style="margin:0 0 16px;font-size:15px">Your verification code is:</p>
          <p style="margin:0 0 16px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#1d5b4c">${code}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#6c7470">It expires in ${LIMITS.OTP_EXPIRY_MINUTES} minutes.</p>
          <p style="margin:0;font-size:14px;color:#6c7470">If you did not sign up for Aawas, you can ignore this email.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOtpEmail(to, code) {
  if (env.NODE_ENV !== "production") console.log(`[OTP] ${to} -> ${code}`);
  if (!env.SMTP_HOST) return; // email not configured: console only

  try {
    await getTransporter().sendMail({
      from: `"Aawas" <${env.SMTP_USER}>`,
      to,
      subject: SUBJECT,
      text: textBody(code),
      html: htmlBody(code),
    });
  } catch (err) {
    // Do not fail signup because email is down: the user can press "Resend".
    console.warn("Could not send OTP email:", err.message);
  }
}
