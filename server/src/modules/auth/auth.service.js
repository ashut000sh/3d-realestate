// AUTH service: all database queries for this module live here.
// Controllers call these functions; nothing else touches the auth tables.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { LIMITS } from "@realestate/shared";
import { query } from "../../config/db.js";
import { httpError } from "../../middleware/errorHandler.js";
import { signToken } from "../../middleware/auth.js";
import { toCamel } from "../../utils/toCamel.js";
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

// Wrong guesses allowed per code. After that the code is used up: press "Resend" for a new one.
export const MAX_OTP_ATTEMPTS = 5;

const USER_COLUMNS = "id, full_name, email, phone, role, is_verified, created_at";

// Compared against when the email doesn't exist, so a wrong email takes as long as a
// wrong password and nobody can probe which emails are registered by timing.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

async function findUserById(userId) {
  const { rows } = await query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [userId]);
  return rows[0] ?? null;
}

function withToken(row) {
  const user = toCamel(row);
  return { token: signToken(user), user };
}

export async function verifyOtp({ userId, otp }) {
  const user = await findUserById(userId);
  if (!user) throw httpError(404, "Account not found");
  if (user.is_verified) throw httpError(409, "This account is already verified, please log in");

  // Only the newest code counts: pressing "Resend" makes older codes useless.
  const { rows } = await query(
    `SELECT id, code_hash FROM otp_codes
     WHERE user_id = $1 AND used_at IS NULL AND expires_at > now() AND attempts < $2
     ORDER BY id DESC LIMIT 1`,
    [userId, MAX_OTP_ATTEMPTS],
  );
  const code = rows[0];
  if (!code) throw httpError(400, "This code has expired. Please request a new one");
  if (!(await bcrypt.compare(otp, code.code_hash))) {
    // Count the wrong try in one statement, so guesses sent at the same time are all counted.
    // The last allowed wrong try also uses the code up.
    const counted = await query(
      `UPDATE otp_codes
          SET attempts = attempts + 1,
              used_at = CASE WHEN attempts + 1 >= $2 THEN now() ELSE used_at END
        WHERE id = $1
        RETURNING attempts`,
      [code.id, MAX_OTP_ATTEMPTS],
    );
    const left = MAX_OTP_ATTEMPTS - counted.rows[0].attempts;
    if (left <= 0) throw httpError(429, "Too many wrong codes. Please request a new one");
    throw httpError(400, `Wrong code. ${left} ${left === 1 ? "try" : "tries"} left`);
  }

  await query("UPDATE otp_codes SET used_at = now() WHERE id = $1", [code.id]);
  const updated = await query(
    `UPDATE users SET is_verified = true WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [userId],
  );
  return withToken(updated.rows[0]);
}

export async function resendOtp({ userId }) {
  const user = await findUserById(userId);
  if (!user) throw httpError(404, "Account not found");
  if (user.is_verified) throw httpError(409, "This account is already verified, please log in");

  // otp_codes has no created_at, so work it out from expires_at.
  const { rows } = await query(
    `SELECT 1 FROM otp_codes
     WHERE user_id = $1
       AND expires_at - make_interval(mins => $2) > now() - make_interval(secs => $3)
     LIMIT 1`,
    [userId, LIMITS.OTP_EXPIRY_MINUTES, LIMITS.OTP_RESEND_SECONDS],
  );
  if (rows.length > 0) {
    throw httpError(429, `Please wait ${LIMITS.OTP_RESEND_SECONDS} seconds before asking again`);
  }

  await issueOtp(user.id, user.email);
  return { otpSentTo: maskEmail(user.email) };
}

export async function login({ email, password }) {
  const { rows } = await query(
    `SELECT ${USER_COLUMNS}, password_hash FROM users WHERE email = $1`,
    [email],
  );
  const row = rows[0];
  const passwordOk = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !passwordOk) throw httpError(401, "Wrong email or password");

  if (!row.is_verified) {
    throw httpError(403, "Please verify your email first", { userId: row.id });
  }

  delete row.password_hash;
  return withToken(row);
}

export async function getMe(userId) {
  const user = await findUserById(userId);
  // Token is valid but the account was deleted since it was issued
  if (!user) throw httpError(401, "Account not found, please log in again");
  return { user: toCamel(user) };
}
