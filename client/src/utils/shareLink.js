// Share links point at the API server's /share/listings/:id page (not the React app), because
// only that page can give WhatsApp, Viber, Messenger and Facebook a preview with the listing's
// photo, title and price. It then sends people on to the listing (or its 3D tour).
import { SHARE, buildPath } from "@realestate/shared";
import { formatPrice } from "./formatPrice.js";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// shareLink(7) -> "http://localhost:4000/share/listings/7"; { tour: true } adds ?view=tour
export function shareLink(listingId, { tour = false } = {}) {
  const url = new URL(buildPath(SHARE.LISTING, { id: listingId }), API_URL);
  if (tour) url.searchParams.set("view", "tour");
  return url.href;
}

// "3BHK house in Budhanilkantha · Rs. 2,75,00,000 · Walk through it in 3D"
export function shareText(listing) {
  return [
    listing.title,
    formatPrice(listing.price, listing.type),
    listing.tourUrl || listing.hasTour ? "Walk through it in 3D" : "See it on Aawas",
  ].join(" · ");
}
