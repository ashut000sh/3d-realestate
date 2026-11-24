// ADMIN controllers: read the request, call the service, send the response.
// No SQL in here. Database work belongs in admin.service.js.
// Every route here is admin only (requireRole(ROLES.ADMIN) in admin.routes.js).
import { ROLES, SCAN_STATUS } from "@realestate/shared";
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

// Optional filter: missing or "" = no filter, otherwise must be one of the constant's values
function readFilter(value, constants, name) {
  if (value === undefined || value === "") return null;
  const allowed = Object.values(constants);
  if (!allowed.includes(value))
    throw httpError(400, `${name} must be one of: ${allowed.join(", ")}`);
  return value;
}
