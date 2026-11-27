// SHARE routes: link-preview pages for shared listings. Not under /api (they return HTML).
// Path comes from shared/api-endpoints.js (SHARE), details in docs/API.md -> "SHARE".
import { Router } from "express";
import { SHARE } from "@realestate/shared";
import * as controller from "./share.controller.js";

const router = Router();

router.get(SHARE.LISTING, controller.listing);

export default router;
