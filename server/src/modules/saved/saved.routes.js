// SAVED routes: a logged-in user's saved homes (the heart button).
// URLs come from shared/api-endpoints.js, shapes are in docs/API.md -> "SAVED".
import { Router } from "express";
import { API } from "@realestate/shared";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./saved.controller.js";

const router = Router();

// IDS before LIST/:listingId-style routes so "/ids" is never read as an id
router.get(API.SAVED.IDS, requireAuth, controller.ids);
router.get(API.SAVED.LIST, requireAuth, controller.list);
router.post(API.SAVED.ADD, requireAuth, controller.add);
router.delete(API.SAVED.REMOVE, requireAuth, controller.remove);

export default router;
