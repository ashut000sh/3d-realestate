// WALKING routes: walking directions from a listing to a nearby place.
// URL comes from shared/api-endpoints.js, shape is in docs/API.md -> "WALKING".
import { Router } from "express";
import { API, WALKING_ROUTE } from "@realestate/shared";
import { rateLimit } from "../../middleware/rateLimit.js";
import * as controller from "./walking.controller.js";

const router = Router();

router.get(
  API.LISTINGS.WALKING_ROUTE,
  rateLimit({ max: WALKING_ROUTE.RATE_LIMIT_PER_MINUTE, windowMs: 60_000, name: "walking routes" }),
  controller.route,
);

export default router;
