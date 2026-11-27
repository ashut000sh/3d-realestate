// How each "What's nearby" category looks: label, icon and marker colour.
// The category keys come from shared/constants.js (NEARBY_CATEGORY).
import { NEARBY, NEARBY_CATEGORY } from "@realestate/shared";

// Order = order of chips and list groups on the Listing page
export const CATEGORIES = [
  {
    key: NEARBY_CATEGORY.SCHOOL,
    label: "Schools",
    one: "School",
    icon: "school",
    color: "#2c5f8a",
  },
  {
    key: NEARBY_CATEGORY.HEALTH,
    label: "Hospitals & clinics",
    one: "Clinic",
    icon: "health",
    color: "#b4382c",
  },
  {
    key: NEARBY_CATEGORY.PHARMACY,
    label: "Pharmacies",
    one: "Pharmacy",
    icon: "pill",
    color: "#2f7d55",
  },
  {
    key: NEARBY_CATEGORY.BUS_STOP,
    label: "Bus stops",
    one: "Bus stop",
    icon: "bus",
    color: "#1d5b4c",
  },
  {
    key: NEARBY_CATEGORY.WORSHIP,
    label: "Temples & worship",
    one: "Place of worship",
    icon: "temple",
    color: "#a27d34",
  },
  { key: NEARBY_CATEGORY.MARKET, label: "Markets", one: "Market", icon: "cart", color: "#b7791f" },
  {
    key: NEARBY_CATEGORY.BANK,
    label: "Banks & ATMs",
    one: "Bank / ATM",
    icon: "bank",
    color: "#0e2a23",
  },
];

export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

// 250 -> "250 m", 1240 -> "1.2 km"
export function formatDistance(meters) {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// 250 m at 80 m/min -> "3 min walk"
export function walkTime(meters) {
  return `${Math.max(1, Math.round(meters / NEARBY.WALK_METERS_PER_MINUTE))} min walk`;
}
