// AUTH controllers: read the request, call the service, send the response.
// No SQL in here. Database work belongs in auth.service.js.
import { ROLES } from "@realestate/shared";
import { httpError } from "../../middleware/errorHandler.js";
import { notImplemented } from "../../utils/notImplemented.js";
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
export const verifyOtp = notImplemented("POST /api/auth/verify-otp");

// POST /api/auth/resend-otp   (public)
// in:  { userId }
// out: 200 { otpSentTo }
export const resendOtp = notImplemented("POST /api/auth/resend-otp");

// POST /api/auth/login   (public)
// in:  { email, password }
// out: 200 { token, user: User } · 401 wrong email or password · 403 { error, userId } if email not verified
export const login = notImplemented("POST /api/auth/login");

// GET /api/auth/me   (logged in)
// in:  -
// out: 200 { user: User }
export const me = notImplemented("GET /api/auth/me");
