// NEARBY controllers: read the request, call the service, send the response.
import { verifyToken } from "../../middleware/auth.js";
import { httpError } from "../../middleware/errorHandler.js";
import { getVisibleListing } from "../listings/listings.service.js";
import * as nearbyService from "./nearby.service.js";

// GET /api/listings/:id/nearby   (public)
// in:  -
// out: 200 { items: NearbyPlace[], message: string | null }
//      NearbyPlace = { category, name, lat, lng, distanceMeters }, nearest first
//      404 if the listing doesn't exist or the viewer can't see it (same rule as GET /listings/:id)
// Overpass being down or slow is NOT an error: items is [] and message explains it.
export async function nearby(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, "id must be a positive number");

  // Public route: the token is optional (lets a seller see nearby places on their own draft)
  const header = req.headers.authorization ?? "";
  const viewer = header.startsWith("Bearer ") ? verifyToken(header.slice(7)) : null;
  const { listing } = await getVisibleListing(id, viewer);

  res.json(await nearbyService.getNearby(listing));
}
