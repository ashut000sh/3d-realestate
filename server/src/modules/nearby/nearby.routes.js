// NEARBY routes: places around a listing (schools, clinics, bus stops...).
// URL comes from shared/api-endpoints.js, shape is in docs/API.md -> "NEARBY".
import { Router } from "express";
import { API } from "@realestate/shared";
import * as controller from "./nearby.controller.js";

const router = Router();

// Public. Same visibility as GET /api/listings/:id (live, or the seller's own / admin).
router.get(API.LISTINGS.NEARBY, controller.nearby);

export default router;
