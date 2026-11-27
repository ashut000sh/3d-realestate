// ADMIN controllers: read the request, call the service, send the response.
// No SQL in here. Database work belongs in admin.service.js.
// Every route here is admin only (requireRole(ROLES.ADMIN) in admin.routes.js).
import { BOOKING_STATUS, ROLES, SCAN_STATUS } from "@realestate/shared";
import { httpError } from "../../middleware/errorHandler.js";
import * as adminService from "./admin.service.js";

// GET /api/admin/stats   (admin)
// in:  -
// out: 200 { listings, users, pendingScans, bookingsThisWeek }
export async function stats(_req, res) {
  res.json(await adminService.getStats());
}

// GET /api/admin/scan-requests   (admin)
// in:  query: ?status
// out: 200 { items: ScanRequest[] }   (each also has sellerFullName)
export async function scanQueue(req, res) {
  res.json(await adminService.listScanQueue(readFilter(req.query.status, SCAN_STATUS, "status")));
}

// GET /api/admin/users   (admin)
// in:  query: ?role
// out: 200 { items: User[] }
export async function users(req, res) {
  res.json(await adminService.listUsers(readFilter(req.query.role, ROLES, "role")));
}

// PATCH /api/admin/users/:id/verify-seller     (admin)
// PATCH /api/admin/users/:id/unverify-seller   (admin)
// in:  -   (the admin's identity comes from the token)
// out: 200 { userId, sellerVerified, sellerVerifiedAt }   400 if the user isn't a seller, 404 unknown
export async function verifySeller(req, res) {
  res.json(await adminService.setSellerVerified(readUserId(req.params.id), req.user.id, true));
}
export async function unverifySeller(req, res) {
  res.json(await adminService.setSellerVerified(readUserId(req.params.id), req.user.id, false));
}

function readUserId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, "id must be a positive number");
  return id;
}

// GET /api/admin/insights   (admin)
// in:  -
// out: 200 Insights (docs/API.md): numbers for the dashboard charts
export async function insights(_req, res) {
  res.json(await adminService.getInsights());
}

// GET /api/admin/bookings   (admin)
// in:  query: ?status
// out: 200 { items: Booking[] }   every booking on the platform, newest first (max 200)
export async function bookings(req, res) {
  res.json(
    await adminService.listAllBookings(readFilter(req.query.status, BOOKING_STATUS, "status")),
  );
}

// Optional filter: missing or "" = no filter, otherwise must be one of the constant's values
function readFilter(value, constants, name) {
  if (value === undefined || value === "") return null;
  const allowed = Object.values(constants);
  if (!allowed.includes(value))
    throw httpError(400, `${name} must be one of: ${allowed.join(", ")}`);
  return value;
}
