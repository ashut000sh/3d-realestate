// NEARBY service: schools, clinics, bus stops... within NEARBY.RADIUS_METERS of a listing,
// from the free OpenStreetMap Overpass API. Called by the server, never by the browser.
//
// Overpass is a shared, free service with strict usage limits, so:
//   - results are cached in memory per listing for NEARBY.CACHE_HOURS
//   - a failed lookup is cached for NEARBY.FAILED_CACHE_MINUTES (no hammering while it's down)
//   - two visitors opening the same listing at once share one request
//   - servers are tried one after another (never in parallel) within NEARBY.TIMEOUT_MS total
// Any failure returns an empty list with a friendly message. This never throws a 500.
import { NEARBY, NEARBY_CATEGORY } from "@realestate/shared";
import { env } from "../../config/env.js";

const DEFAULT_OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const OVERPASS_URLS = env.OVERPASS_URLS
  ? env.OVERPASS_URLS.split(",")
      .map((url) => url.trim())
      .filter(Boolean)
  : DEFAULT_OVERPASS_URLS;

const MAX_CACHE_ENTRIES = 1000; // ~1000 listings x a few KB each; oldest dropped first
const UNAVAILABLE = "Nearby places are unavailable right now. Please try again later.";

// OSM tag -> our category. First match wins.
const TAG_RULES = [
  ["amenity", ["school", "kindergarten", "college", "university"], NEARBY_CATEGORY.SCHOOL],
  ["amenity", ["hospital", "clinic", "doctors"], NEARBY_CATEGORY.HEALTH],
  ["amenity", ["pharmacy"], NEARBY_CATEGORY.PHARMACY],
  ["shop", ["chemist"], NEARBY_CATEGORY.PHARMACY],
  ["highway", ["bus_stop"], NEARBY_CATEGORY.BUS_STOP],
  ["amenity", ["bus_station"], NEARBY_CATEGORY.BUS_STOP],
  ["amenity", ["place_of_worship"], NEARBY_CATEGORY.WORSHIP],
  ["amenity", ["marketplace"], NEARBY_CATEGORY.MARKET],
  ["shop", ["supermarket", "mall", "department_store"], NEARBY_CATEGORY.MARKET],
  ["amenity", ["bank", "atm"], NEARBY_CATEGORY.BANK],
];

// Shown when a place has no name in OSM (common for bus stops and ATMs)
const FALLBACK_NAME = {
  [NEARBY_CATEGORY.SCHOOL]: "School",
  [NEARBY_CATEGORY.HEALTH]: "Clinic",
  [NEARBY_CATEGORY.PHARMACY]: "Pharmacy",
  [NEARBY_CATEGORY.BUS_STOP]: "Bus stop",
  [NEARBY_CATEGORY.WORSHIP]: "Place of worship",
  [NEARBY_CATEGORY.MARKET]: "Market",
  [NEARBY_CATEGORY.BANK]: "Bank",
};

// One Overpass query for every category: one regex per tag key.
function buildQuery(lat, lng) {
  const byKey = new Map();
  TAG_RULES.forEach(([key, values]) => byKey.set(key, [...(byKey.get(key) ?? []), ...values]));
  const around = `around:${NEARBY.RADIUS_METERS},${lat},${lng}`;
  const parts = [...byKey].map(
    ([key, values]) => `nwr(${around})[${key}~"^(${values.join("|")})$"];`,
  );
  const seconds = Math.ceil(NEARBY.TIMEOUT_MS / 1000);
  return `[out:json][timeout:${seconds}];(${parts.join("")});out center tags;`;
}

function categoryOf(tags) {
  const rule = TAG_RULES.find(([key, values]) => values.includes(tags[key]));
  return rule?.[2] ?? null;
}

// Great-circle distance in metres
function distanceMeters(lat1, lng1, lat2, lng2) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

// Overpass elements -> [{ id, category, name, lat, lng, distanceMeters }], nearest first,
// at most NEARBY.MAX_PER_CATEGORY per category.
export function toPlaces(elements, lat, lng) {
  const places = [];
  const seen = new Set();
  for (const el of elements) {
    const tags = el.tags ?? {};
    const category = categoryOf(tags);
    const pLat = el.lat ?? el.center?.lat;
    const pLng = el.lon ?? el.center?.lon;
    if (!category || typeof pLat !== "number" || typeof pLng !== "number") continue;
    const name = tags["name:en"] || tags.name || FALLBACK_NAME[category];
    const distance = Math.round(distanceMeters(lat, lng, pLat, pLng));
    if (distance > NEARBY.RADIUS_METERS) continue;
    // The same temple is often mapped as a node and a building: keep one
    const key = `${category}|${name}|${Math.round(distance / 25)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // id: the OpenStreetMap element, e.g. "node/123" (stable, so the website can key on it)
    places.push({
      id: `${el.type}/${el.id}`,
      category,
      name,
      lat: pLat,
      lng: pLng,
      distanceMeters: distance,
    });
  }
  places.sort((a, b) => a.distanceMeters - b.distanceMeters);
  const perCategory = {};
  return places.filter(
    (p) =>
      (perCategory[p.category] = (perCategory[p.category] ?? 0) + 1) <= NEARBY.MAX_PER_CATEGORY,
  );
}

// Asks each Overpass server in turn until one answers, all inside one time budget.
async function fetchOverpass(lat, lng) {
  const deadline = Date.now() + NEARBY.TIMEOUT_MS;
  const body = new URLSearchParams({ data: buildQuery(lat, lng) });
  let lastError = null;
  for (const url of OVERPASS_URLS) {
    const remaining = deadline - Date.now();
    if (remaining <= 200) break;
    try {
      const res = await fetch(url, {
        method: "POST",
        body,
        headers: { "User-Agent": "Aawas/1.0 (property listings; nearby places)" },
        signal: AbortSignal.timeout(remaining),
      });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const json = await res.json();
      return json.elements ?? [];
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("Overpass timed out");
}

const cache = new Map(); // key -> { expiresAt, value } | { promise }

function remember(key, value, ms) {
  cache.delete(key); // re-insert so it counts as newest
  cache.set(key, { expiresAt: Date.now() + ms, value });
  while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
}

// listing: { id, lat, lng }  ->  { items, message }
export async function getNearby(listing) {
  const lat = listing.lat === null || listing.lat === undefined ? NaN : Number(listing.lat);
  const lng = listing.lng === null || listing.lng === undefined ? NaN : Number(listing.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { items: [], message: "This home has no map location yet." };
  }

  // Key includes the location, so a seller moving the pin gets fresh results
  const key = `${listing.id}|${lat.toFixed(5)}|${lng.toFixed(5)}`;
  const hit = cache.get(key);
  if (hit?.promise) return hit.promise;
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const promise = fetchOverpass(lat, lng)
    .then((elements) => {
      const value = { items: toPlaces(elements, lat, lng), message: null };
      remember(key, value, NEARBY.CACHE_HOURS * 3600 * 1000);
      return value;
    })
    .catch((err) => {
      console.warn(`[nearby] listing ${listing.id}: ${err.message}`);
      const value = { items: [], message: UNAVAILABLE };
      remember(key, value, NEARBY.FAILED_CACHE_MINUTES * 60 * 1000);
      return value;
    });
  cache.set(key, { promise });
  return promise;
}
