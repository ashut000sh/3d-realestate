// WALKING service: the walking route from a listing to a place, from an OSRM routing server
// with a foot profile (env.ROUTING_URL; default: the free routing.openstreetmap.de server).
//
// Like the nearby places, this protects a free shared service:
//   - each listing + destination is cached in memory for WALKING_ROUTE.CACHE_HOURS
//   - a failed lookup is cached for WALKING_ROUTE.FAILED_CACHE_MINUTES
//   - one request at a time per listing + destination; WALKING_ROUTE.TIMEOUT_MS at most
//   - the route endpoint is also rate limited per IP (walking.routes.js)
// If the router fails, we answer with a straight line and approximate: true. Never a 500.
import { NEARBY, WALKING_ROUTE } from "@realestate/shared";
import { env } from "../../config/env.js";

const MAX_CACHE_ENTRIES = 5000; // a route is a few KB; oldest dropped first

// Great-circle distance in metres
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

// Minutes on foot: the router's own duration when it has one, else distance at 80 m/min
export function walkingMinutes(distance, durationSeconds) {
  const minutes =
    typeof durationSeconds === "number" && durationSeconds > 0
      ? durationSeconds / 60
      : distance / NEARBY.WALK_METERS_PER_MINUTE;
  return Math.max(1, Math.round(minutes));
}

function straightLine(from, to) {
  const distance = Math.round(distanceMeters(from.lat, from.lng, to.lat, to.lng));
  return {
    distanceMeters: distance,
    durationMinutes: walkingMinutes(distance),
    coordinates: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
    approximate: true,
  };
}

async function askRouter(from, to) {
  // OSRM wants lng,lat. Numbers only (already checked), so nothing user-typed goes in the URL.
  const url =
    `${env.ROUTING_URL}/route/v1/foot/${from.lng},${from.lat};${to.lng},${to.lat}` +
    "?overview=full&geometries=geojson";
  const res = await fetch(url, {
    headers: { "User-Agent": "Aawas/1.0 (property listings; walking routes)" },
    signal: AbortSignal.timeout(WALKING_ROUTE.TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`router ${res.status}`);
  const json = await res.json();
  const route = json.routes?.[0];
  if (json.code !== "Ok" || !route?.geometry?.coordinates?.length) {
    throw new Error(`router: ${json.code ?? "no route"}`);
  }
  const distance = Math.round(route.distance);
  return {
    distanceMeters: distance,
    durationMinutes: walkingMinutes(distance, route.duration),
    // GeoJSON is [lng, lat]; Leaflet (and our API) use [lat, lng]
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    approximate: false,
  };
}

const cache = new Map(); // key -> { expiresAt, value } | { promise }

function remember(key, value, ms) {
  cache.delete(key);
  cache.set(key, { expiresAt: Date.now() + ms, value });
  while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
}

// from: the listing { id, lat, lng }. to: { lat, lng } (checked by the controller).
// -> { distanceMeters, durationMinutes, coordinates: [[lat, lng], ...], approximate }
export async function getWalkingRoute(listing, to) {
  const from = { lat: Number(listing.lat), lng: Number(listing.lng) };
  // 5 decimals is about 1 m: two clicks on the same spot share one cache entry
  const key = `${listing.id}|${from.lat.toFixed(5)},${from.lng.toFixed(5)}|${to.lat.toFixed(5)},${to.lng.toFixed(5)}`;
  const hit = cache.get(key);
  if (hit?.promise) return hit.promise;
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const promise = askRouter(from, to)
    .then((value) => {
      remember(key, value, WALKING_ROUTE.CACHE_HOURS * 3600 * 1000);
      return value;
    })
    .catch((err) => {
      console.warn(`[walking] listing ${listing.id}: ${err.message}`);
      const value = straightLine(from, to);
      remember(key, value, WALKING_ROUTE.FAILED_CACHE_MINUTES * 60 * 1000);
      return value;
    });
  cache.set(key, { promise });
  return promise;
}
