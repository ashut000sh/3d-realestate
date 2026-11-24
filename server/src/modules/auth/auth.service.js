// AUTH service: all database queries for this module live here.
// Controllers call these functions; nothing else touches the auth tables.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { LIMITS } from "@realestate/shared";
import { query } from "../../config/db.js";
import { httpError } from "../../middleware/errorHandler.js";
import { sendOtpEmail } from "./auth.mail.js";

// "sita@gmail.com" -> "s***@gmail.com"
export function maskEmail(email) {
  const [name, domain] = email.split("@");
  return `${name[0]}***@${domain}`;
}

// Makes a new OTP, stores only its hash, and emails it.
export async function issueOtp(userId, email) {
  const code = String(crypto.randomInt(0, 10 ** LIMITS.OTP_LENGTH)).padStart(
    LIMITS.OTP_LENGTH,
    "0",
  );
  const codeHash = await bcrypt.hash(code, 8);
  await query(
    `INSERT INTO otp_codes (user_id, code_hash, expires_at)
     VALUES ($1, $2, now() + make_interval(mins => $3))`,
    [userId, codeHash, LIMITS.OTP_EXPIRY_MINUTES],
  );
  await sendOtpEmail(email, code);
}

export async function signup({ fullName, email, phone, password, role }) {
  const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) throw httpError(409, "This email is already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  let user;
  try {
    const { rows } = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email`,
      [fullName, email, phone ?? null, passwordHash, role],
    );
    user = rows[0];
  } catch (err) {
    // Two signups with the same email at the same moment
    if (err.code === "23505") throw httpError(409, "This email is already registered");
    throw err;
  }

  await issueOtp(user.id, user.email);
  return { userId: user.id, otpSentTo: maskEmail(user.email) };
}
