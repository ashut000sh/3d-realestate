// AUTH controllers: read the request, call the service, send the response.
// No SQL in here. Database work belongs in auth.service.js.
import { LIMITS, ROLES } from "@realestate/shared";
import { httpError } from "../../middleware/errorHandler.js";
import * as authService from "./auth.service.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10}$/;

// POST /api/auth/signup   (public)
// in:  { fullName, email, phone, password, role: "buyer" | "seller" }
// out: 201 { userId, otpSentTo }
export async function signup(req, res) {
  const { fullName, email, phone, password, role } = req.body ?? {};

  if (typeof fullName !== "string" || fullName.trim().length < 2) {
    throw httpError(400, "Full name is required");
  }
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
    throw httpError(400, "A valid email is required");
  }
  if (phone && !PHONE_PATTERN.test(phone)) {
    throw httpError(400, "Phone must be 10 digits");
  }
  if (typeof password !== "string" || password.length < 8) {
    throw httpError(400, "Password must be at least 8 characters");
  }
  // Nobody can sign up as admin
  if (role !== ROLES.BUYER && role !== ROLES.SELLER) {
    throw httpError(400, "Role must be buyer or seller");
  }

  const result = await authService.signup({
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone || null,
    password,
    role,
  });
  res.status(201).json(result);
}

// POST /api/auth/verify-otp   (public)
// in:  { userId, otp }
// out: 200 { token, user: User }
export async function verifyOtp(req, res) {
  const { userId, otp } = req.body ?? {};
  const id = readUserId(userId);
  const otpPattern = new RegExp(`^\\d{${LIMITS.OTP_LENGTH}}$`);
  if (typeof otp !== "string" || !otpPattern.test(otp)) {
    throw httpError(400, `The code must be ${LIMITS.OTP_LENGTH} digits`);
  }
  res.json(await authService.verifyOtp({ userId: id, otp }));
}

// POST /api/auth/resend-otp   (public)
// in:  { userId }
// out: 200 { otpSentTo }
export async function resendOtp(req, res) {
  const id = readUserId(req.body?.userId);
  res.json(await authService.resendOtp({ userId: id }));
}

// POST /api/auth/login   (public)
// in:  { email, password }
// out: 200 { token, user: User } · 401 wrong email or password · 403 { error, userId } if email not verified
export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    throw httpError(400, "Email and password are required");
  }
  res.json(await authService.login({ email: email.trim().toLowerCase(), password }));
}

// GET /api/auth/me   (logged in)
// in:  -
// out: 200 { user: User }
export async function me(req, res) {
  res.json(await authService.getMe(req.user.id));
}

// userId may arrive as 7 or "7"
function readUserId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, "userId is required");
  return id;
}
