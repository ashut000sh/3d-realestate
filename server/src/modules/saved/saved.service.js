// SAVED service: all database queries for saved homes live here.
import { LISTING_STATUS } from "@realestate/shared";
import { query } from "../../config/db.js";
import { httpError } from "../../middleware/errorHandler.js";
import { SUMMARY_COLUMNS, toSummary } from "../listings/listings.service.js";

// Saved listings that are still live, newest saved first.
// (A saved listing that gets archived simply stops showing; the row stays.)
export async function listSaved(userId) {
  const { rows } = await query(
    `SELECT ${SUMMARY_COLUMNS}
       FROM saved_listings s
       JOIN listings l ON l.id = s.listing_id
      WHERE s.user_id = $1 AND l.status = $2
      ORDER BY s.created_at DESC, l.id DESC`,
    [userId, LISTING_STATUS.LIVE],
  );
  return { items: rows.map(toSummary) };
}

export async function savedIds(userId) {
  const { rows } = await query(
    "SELECT listing_id FROM saved_listings WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return { ids: rows.map((row) => row.listing_id) };
}

// Only live listings can be saved. Saving twice does nothing (ON CONFLICT).
export async function saveListing(userId, listingId) {
  const listing = await query("SELECT status FROM listings WHERE id = $1", [listingId]);
  if (listing.rows[0]?.status !== LISTING_STATUS.LIVE) throw httpError(404, "Listing not found");
  await query(
    `INSERT INTO saved_listings (user_id, listing_id) VALUES ($1, $2)
     ON CONFLICT (user_id, listing_id) DO NOTHING`,
    [userId, listingId],
  );
  return { listingId };
}

export async function unsaveListing(userId, listingId) {
  await query("DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2", [
    userId,
    listingId,
  ]);
  return { listingId };
}
