// LISTINGS routes. Owner: M4. URLs come from shared/api-endpoints.js,
// request/response shapes are in docs/API.md -> "LISTINGS".
import { Router } from "express";
import { API, ROLES } from "@realestate/shared";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as controller from "./listings.controller.js";

const router = Router();

router.get(API.LISTINGS.LIST, controller.list);
router.get(API.LISTINGS.COMPARE, controller.compare);
// MINE before ONE, so "/mine" is never read as an id
router.get(API.LISTINGS.MINE, requireAuth, requireRole(ROLES.SELLER), controller.mine);
router.get(API.LISTINGS.ONE, controller.one);
router.post(API.LISTINGS.CREATE, requireAuth, requireRole(ROLES.SELLER), controller.create);
router.patch(API.LISTINGS.UPDATE, requireAuth, requireRole(ROLES.SELLER), controller.update);
router.post(
  API.LISTINGS.UPLOAD_IMAGES,
  requireAuth,
  requireRole(ROLES.SELLER),
  controller.uploadImages,
);

export default router;
