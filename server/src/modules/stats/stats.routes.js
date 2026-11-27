// STATS routes: listing view counting and the seller's per-listing numbers.
// URLs come from shared/api-endpoints.js, shapes are in docs/API.md -> "STATS".
import { Router } from "express";
import { API, ROLES } from "@realestate/shared";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as controller from "./stats.controller.js";

const router = Router();

router.post(API.LISTINGS.RECORD_VIEW, controller.recordView);
router.get(API.LISTINGS.MINE_STATS, requireAuth, requireRole(ROLES.SELLER), controller.mine);

export default router;
