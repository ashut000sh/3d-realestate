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

// How land is measured, by district (shared/area.js does the maths).
//   ropani: hill system, ropani-aana-paisa-daam (Kathmandu valley, Pokhara)
//   bigha:  Terai system, bigha-kattha-dhur (the plains, e.g. Chitwan)
export const AREA_SYSTEM = {
  ROPANI: "ropani",
  BIGHA: "bigha",
};

// Every district in DISTRICTS must be here. New district? Add it to both.
export const DISTRICT_AREA_SYSTEM = {
  Kathmandu: AREA_SYSTEM.ROPANI,
  Lalitpur: AREA_SYSTEM.ROPANI,
  Bhaktapur: AREA_SYSTEM.ROPANI,
  Kaski: AREA_SYSTEM.ROPANI,
  Chitwan: AREA_SYSTEM.BIGHA,
};

// Number of floors a listing can have (listings.floors, CHECK in 007_listing_floors.sql)
export const FLOORS = { MIN: 1, MAX: 10 };

export const LIMITS = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
  OTP_RESEND_SECONDS: 60,
  MAX_COMPARE: 3,
  PAGE_SIZE: 20,
};
