// requireAuth: rejects requests without a valid token and sets req.user = { id, role }.
// requireRole(ROLES.ADMIN): use after requireAuth to limit a route to one role.
// signToken / verifyToken: the only place JWTs are made and checked.
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// 7 days so people aren't logged out mid-week; there is no refresh token yet.
const TOKEN_EXPIRY = "7d";

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Returns { id, role } or null if the token is missing, tampered with or expired.
export function verifyToken(token) {
  try {
    const { id, role } = jwt.verify(token, env.JWT_SECRET);
    return { id, role };
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not logged in" });

  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: "Session expired, please log in again" });

  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have access to this" });
    }
    next();
  };
}
