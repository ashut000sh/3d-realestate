// BOOKINGS routes. Owner: M5. URLs come from shared/api-endpoints.js,
// request/response shapes are in docs/API.md -> "BOOKINGS".
import { Router } from "express";
import { API } from "@realestate/shared";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./bookings.controller.js";

const router = Router();

// Public: blocked dates of a short stay (dates only, no guest data)
router.get(API.LISTINGS.AVAILABILITY, controller.availability);
router.post(API.BOOKINGS.CREATE, requireAuth, controller.create);
router.get(API.BOOKINGS.MINE, requireAuth, controller.mine);
router.patch(API.BOOKINGS.UPDATE_STATUS, requireAuth, controller.updateStatus);

export default router;
