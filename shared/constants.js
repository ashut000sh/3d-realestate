// Values that BOTH frontend and backend (and the database) must agree on.
// The strings on the right are what gets stored in the database and sent over the API.
// Changing one here? Also update the CHECK constraint in server/db/migrations and tell the team.

export const ROLES = {
  BUYER: "buyer",
  SELLER: "seller",
  ADMIN: "admin",
};

export const LISTING_TYPE = {
  SALE: "sale",
  RENT: "rent",
  SHORT_STAY: "short_stay",
};

export const LISTING_STATUS = {
  DRAFT: "draft", // created, no 3D tour yet
  AWAITING_SCAN: "awaiting_scan",
  LIVE: "live", // visible to buyers
  ARCHIVED: "archived",
};

export const SCAN_STATUS = {
  PENDING: "pending", // seller asked
  SCHEDULED: "scheduled", // admin picked a date
  SCANNED: "scanned", // captured on site, processing
  PUBLISHED: "published", // 3D tour uploaded and attached to the listing
  CANCELLED: "cancelled",
};

export const BOOKING_KIND = {
  VIEWING: "viewing",
  STAY: "stay",
};

export const BOOKING_STATUS = {
  REQUESTED: "requested",
  CONFIRMED: "confirmed",
  DECLINED: "declined",
  CANCELLED: "cancelled",
};

export const DISTRICTS = ["Kathmandu", "Lalitpur", "Bhaktapur", "Kaski", "Chitwan"];

export const LIMITS = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
  OTP_RESEND_SECONDS: 60,
  MAX_COMPARE: 3,
  PAGE_SIZE: 20,
};

// "What's nearby" on the Listing page (GET /api/listings/:id/nearby, data from OpenStreetMap).
// The server maps OSM tags to these categories (server/src/modules/nearby/nearby.service.js).
export const NEARBY_CATEGORY = {
  SCHOOL: "school",
  HEALTH: "health", // hospitals and clinics
  PHARMACY: "pharmacy",
  BUS_STOP: "bus_stop",
  WORSHIP: "worship", // temples, stupas, churches, mosques
  MARKET: "market", // markets and supermarkets
  BANK: "bank", // banks and ATMs
};

export const NEARBY = {
  RADIUS_METERS: 1000,
  MAX_PER_CATEGORY: 10,
  CACHE_HOURS: 24,
  FAILED_CACHE_MINUTES: 10, // after Overpass fails, wait this long before asking again
  TIMEOUT_MS: 8000,
  WALK_METERS_PER_MINUTE: 80,
};

// Walking route from a listing to a place (GET /api/listings/:id/route, OSRM foot routing)
export const WALKING_ROUTE = {
  CACHE_HOURS: 24,
  FAILED_CACHE_MINUTES: 10,
  TIMEOUT_MS: 8000,
  RATE_LIMIT_PER_MINUTE: 30, // per IP: protects the free routing server
  MAX_DISTANCE_METERS: 20000, // further than this isn't a walk; refused before asking the router
  // Destinations must be in Nepal (roughly)
  BOUNDS: { MIN_LAT: 26.3, MAX_LAT: 30.5, MIN_LNG: 80, MAX_LNG: 88.3 },
};
