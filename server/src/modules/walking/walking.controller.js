// WALKING controllers: read the request, call the service, send the response.
import { WALKING_ROUTE } from "@realestate/shared";
import { verifyToken } from "../../middleware/auth.js";
import { httpError } from "../../middleware/errorHandler.js";
import { getVisibleListing } from "../listings/listings.service.js";
import * as walkingService from "./walking.service.js";

const { BOUNDS } = WALKING_ROUTE;

// A destination coordinate inside Nepal, else 400
function readCoordinate(value, name, min, max) {
  if (typeof value !== "string" || value.trim() === "") throw httpError(400, `${name} is required`);
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw httpError(400, `${name} must be a number between ${min} and ${max} (inside Nepal)`);
  }
  return number;
}

// GET /api/listings/:id/route   (public, rate limited per IP)
// in:  query: ?lat=27.71&lng=85.32   the destination
// out: 200 { distanceMeters, durationMinutes, coordinates: [[lat, lng], ...], approximate }
//      approximate: true = the router failed, so this is a straight line (never a 500)
//      400 bad lat/lng, listing without a location, or a destination too far to walk
//      404 listing can't be seen (same rule as GET /api/listings/:id) · 429 too many requests
export async function route(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, "id must be a positive number");
  const to = {
    lat: readCoordinate(req.query.lat, "lat", BOUNDS.MIN_LAT, BOUNDS.MAX_LAT),
    lng: readCoordinate(req.query.lng, "lng", BOUNDS.MIN_LNG, BOUNDS.MAX_LNG),
  };

  // Public route: the token is optional (a seller can try routes on their own draft)
  const header = req.headers.authorization ?? "";
  const viewer = header.startsWith("Bearer ") ? verifyToken(header.slice(7)) : null;
  const { listing } = await getVisibleListing(id, viewer);

  if (typeof listing.lat !== "number" || typeof listing.lng !== "number") {
    throw httpError(400, "This home has no map location yet");
  }
  const straight = walkingService.distanceMeters(listing.lat, listing.lng, to.lat, to.lng);
  if (straight > WALKING_ROUTE.MAX_DISTANCE_METERS) {
    throw httpError(
      400,
      `That place is more than ${WALKING_ROUTE.MAX_DISTANCE_METERS / 1000} km away`,
    );
  }

  res.json(await walkingService.getWalkingRoute(listing, to));
}
