// STATS controllers: read the request, call the service, send the response.
import { STATS, VIEW_KIND } from "@realestate/shared";
import { verifyToken } from "../../middleware/auth.js";
import { httpError } from "../../middleware/errorHandler.js";
import * as statsService from "./stats.service.js";

const KINDS = Object.values(VIEW_KIND);
const SESSION_KEY_PATTERN = new RegExp(`^[A-Za-z0-9_-]{8,${STATS.SESSION_KEY_MAX_LENGTH}}$`);

// POST /api/listings/:id/views   (public)
// in:  { kind: "page" | "tour", sessionKey? }   sessionKey is required when not logged in
// out: 200 { counted: boolean }   false = already counted this hour, or you own the listing
//      404 if the listing isn't live
export async function recordView(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, "id must be a positive number");
  const { kind, sessionKey } = req.body ?? {};
  if (!KINDS.includes(kind)) throw httpError(400, `kind must be one of: ${KINDS.join(", ")}`);

  // Public route: the token is optional. Logged-in viewers are counted by user id.
  const header = req.headers.authorization ?? "";
  const viewer = header.startsWith("Bearer ") ? verifyToken(header.slice(7)) : null;
  if (!viewer && (typeof sessionKey !== "string" || !SESSION_KEY_PATTERN.test(sessionKey))) {
    throw httpError(
      400,
      "sessionKey is required when not logged in (8-64 letters, digits, - or _)",
    );
  }

  res.json(await statsService.recordView(id, kind, viewer?.id ?? null, sessionKey ?? null));
}

// GET /api/listings/mine/stats   (seller)
// in:  -
// out: 200 { windowDays, days: string[], items: ListingStats[] }   (ListingStats: docs/API.md)
export async function mine(req, res) {
  res.json(await statsService.getSellerStats(req.user.id));
}
