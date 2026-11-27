// STATS service: counting listing views and the seller's per-listing numbers.
// Owns the listing_views table. Reads (never writes) listings, saved_listings, bookings and
// conversations to build a seller's stats.
import { BOOKING_STATUS, LISTING_STATUS, STATS } from "@realestate/shared";
import { query, transaction } from "../../config/db.js";
import { httpError } from "../../middleware/errorHandler.js";

// Records a view unless the same viewer (or anonymous session) already viewed this listing,
// with this kind, in the last STATS.VIEW_DEDUPE_MINUTES. Refreshes don't inflate numbers.
// viewerId: logged-in user id or null. sessionKey: anonymous visitor key (used when not logged in).
// Returns { counted: boolean }. The owner and non-live listings are never counted.
export async function recordView(listingId, kind, viewerId, sessionKey) {
  const { rows } = await query("SELECT seller_id, status FROM listings WHERE id = $1", [listingId]);
  const listing = rows[0];
  if (!listing || listing.status !== LISTING_STATUS.LIVE) throw httpError(404, "Listing not found");
  if (viewerId && viewerId === listing.seller_id) return { counted: false };

  // Logged in: one view per user. Anonymous: one per session key.
  const byUser = Boolean(viewerId);
  const who = byUser ? `user:${viewerId}` : `session:${sessionKey}`;
  return transaction(async (client) => {
    // Two requests at the same moment (a double click, React StrictMode) wait for each other
    // here, so the second one sees the first one's row and isn't counted.
    await client.query("SELECT pg_advisory_xact_lock($1::int, hashtext($2))", [
      listingId,
      `${kind}|${who}`,
    ]);
    const inserted = await client.query(
      `INSERT INTO listing_views (listing_id, viewer_id, kind, session_key)
       SELECT $1, $2, $3, $4
        WHERE NOT EXISTS (
          SELECT 1 FROM listing_views
           WHERE listing_id = $1 AND kind = $3
             AND created_at > now() - make_interval(mins => $5)
             AND ${byUser ? "viewer_id = $2" : "viewer_id IS NULL AND session_key = $4"}
        )`,
      [listingId, viewerId, kind, byUser ? null : sessionKey, STATS.VIEW_DEDUPE_MINUTES],
    );
    return { counted: inserted.rowCount === 1 };
  });
}

const emptyBookings = () =>
  Object.fromEntries(Object.values(BOOKING_STATUS).map((status) => [status, 0]));
const emptyNumbers = () => ({
  pageViews: 0,
  tourOpens: 0,
  saves: 0,
  chats: 0,
  bookings: emptyBookings(),
});

// Per listing of this seller: numbers for the last STATS.WINDOW_DAYS days and all time,
// plus daily page views for the window (oldest day first, days in STATS.TIME_ZONE).
export async function getSellerStats(sellerId) {
  const days = STATS.WINDOW_DAYS;
  const since = "now() - make_interval(days => $2)"; // $2 = days in every query that uses it
  const [listings, views, saves, bookings, chats, daily] = await Promise.all([
    query(
      `SELECT id, title, status, tour_url IS NOT NULL AS has_tour
         FROM listings WHERE seller_id = $1 ORDER BY created_at DESC, id DESC`,
      [sellerId],
    ),
    query(
      `SELECT v.listing_id, v.kind, count(*)::int AS total,
              count(*) FILTER (WHERE v.created_at >= ${since})::int AS recent
         FROM listing_views v JOIN listings l ON l.id = v.listing_id
        WHERE l.seller_id = $1
        GROUP BY v.listing_id, v.kind`,
      [sellerId, days],
    ),
    query(
      `SELECT s.listing_id, count(*)::int AS total,
              count(*) FILTER (WHERE s.created_at >= ${since})::int AS recent
         FROM saved_listings s JOIN listings l ON l.id = s.listing_id
        WHERE l.seller_id = $1
        GROUP BY s.listing_id`,
      [sellerId, days],
    ),
    query(
      `SELECT b.listing_id, b.status, count(*)::int AS total,
              count(*) FILTER (WHERE b.created_at >= ${since})::int AS recent
         FROM bookings b JOIN listings l ON l.id = b.listing_id
        WHERE l.seller_id = $1
        GROUP BY b.listing_id, b.status`,
      [sellerId, days],
    ),
    query(
      `SELECT c.listing_id, count(*)::int AS total,
              count(*) FILTER (WHERE c.created_at >= ${since})::int AS recent
         FROM conversations c JOIN listings l ON l.id = c.listing_id
        WHERE l.seller_id = $1
        GROUP BY c.listing_id`,
      [sellerId, days],
    ),
    // Every day of the window (even empty ones), then page views per listing per day
    query(
      `WITH window_days AS (
         SELECT d::date AS day
           FROM generate_series((now() AT TIME ZONE $2)::date - ($3::int - 1),
                                (now() AT TIME ZONE $2)::date, interval '1 day') AS d
       )
       SELECT to_char(w.day, 'YYYY-MM-DD') AS day, v.listing_id, count(v.id)::int AS views
         FROM window_days w
         LEFT JOIN (
           SELECT v.id, v.listing_id, (v.created_at AT TIME ZONE $2)::date AS day
             FROM listing_views v JOIN listings l ON l.id = v.listing_id
            WHERE l.seller_id = $1 AND v.kind = 'page'
              AND v.created_at >= ((now() AT TIME ZONE $2)::date - ($3::int - 1)) AT TIME ZONE $2
         ) v ON v.day = w.day
        GROUP BY w.day, v.listing_id
        ORDER BY w.day`,
      [sellerId, STATS.TIME_ZONE, days],
    ),
  ]);

  const dayList = [...new Set(daily.rows.map((r) => r.day))];
  const dayIndex = new Map(dayList.map((day, i) => [day, i]));

  const byId = new Map(
    listings.rows.map((l) => [
      l.id,
      {
        listingId: l.id,
        title: l.title,
        status: l.status,
        hasTour: l.has_tour,
        last30Days: emptyNumbers(),
        allTime: emptyNumbers(),
        dailyPageViews: dayList.map(() => 0),
      },
    ]),
  );
  const add = (listingId, field, row, status) => {
    const item = byId.get(listingId);
    if (!item) return;
    for (const [bucket, value] of [
      [item.last30Days, row.recent],
      [item.allTime, row.total],
    ]) {
      if (status) bucket.bookings[status] = (bucket.bookings[status] ?? 0) + value;
      else bucket[field] += value;
    }
  };

  views.rows.forEach((r) => add(r.listing_id, r.kind === "tour" ? "tourOpens" : "pageViews", r));
  saves.rows.forEach((r) => add(r.listing_id, "saves", r));
  chats.rows.forEach((r) => add(r.listing_id, "chats", r));
  bookings.rows.forEach((r) => add(r.listing_id, null, r, r.status));
  daily.rows.forEach((r) => {
    const item = r.listing_id && byId.get(r.listing_id);
    if (item) item.dailyPageViews[dayIndex.get(r.day)] = r.views;
  });

  return { windowDays: days, days: dayList, items: [...byId.values()] };
}
