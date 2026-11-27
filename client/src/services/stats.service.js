// Frontend side of the STATS module. Shapes: docs/API.md -> STATS.
import { API, buildPath } from "@realestate/shared";
import { getSessionKey } from "../utils/sessionKey.js";
import { request } from "./api.js";

// Fire and forget: a failed view count must never bother the visitor.
export function recordView(listingId, kind) {
  request("POST", buildPath(API.LISTINGS.RECORD_VIEW, { id: listingId }), {
    body: { kind, sessionKey: getSessionKey() },
  }).catch(() => {});
}

// { windowDays, days, items: ListingStats[] }
export const getMyListingStats = () => request("GET", API.LISTINGS.MINE_STATS);
