// Sends the OTP email. In development the code is ALSO printed in the server console,
// so nobody needs email set up to test signup.
import nodemailer from "nodemailer";
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

export async function sendOtpEmail(to, code) {
  if (env.NODE_ENV !== "production") console.log(`[OTP] ${to} -> ${code}`);
  if (!env.SMTP_HOST) return; // email not configured: console only

  try {
    await getTransporter().sendMail({
      from: env.SMTP_USER,
      to,
      subject: "Your verification code",
      text: `Your code is ${code}. It expires soon. If you did not sign up, ignore this email.`,
    });
  } catch (err) {
    // Do not fail signup because email is down: the user can press "Resend".
    console.warn("Could not send OTP email:", err.message);
  }
}
