// ADMIN routes. Owner: M5. URLs come from shared/api-endpoints.js,
// request/response shapes are in docs/API.md -> "ADMIN".
import { Router } from "express";
import { API, ROLES } from "@realestate/shared";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as controller from "./admin.controller.js";

const router = Router();

router.get(API.ADMIN.STATS, requireAuth, requireRole(ROLES.ADMIN), controller.stats);
router.get(API.ADMIN.SCAN_QUEUE, requireAuth, requireRole(ROLES.ADMIN), controller.scanQueue);
router.get(API.ADMIN.USERS, requireAuth, requireRole(ROLES.ADMIN), controller.users);
router.get(API.ADMIN.INSIGHTS, requireAuth, requireRole(ROLES.ADMIN), controller.insights);
router.get(API.ADMIN.BOOKINGS, requireAuth, requireRole(ROLES.ADMIN), controller.bookings);

export default router;
