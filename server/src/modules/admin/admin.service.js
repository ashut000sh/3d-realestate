// ADMIN service: all database queries for this module live here.
// Read-only: admin CHANGES to scan requests go through the scans module.
import {
  BOOKING_STATUS,
  DISTRICTS,
  LISTING_STATUS,
  LISTING_TYPE,
  SCAN_STATUS,
} from "@realestate/shared";
import { query } from "../../config/db.js";

// Numbers for the four cards at the top of the admin dashboard
export async function getStats() {
  const { rows } = await query(
    `SELECT
       (SELECT count(*)::int FROM listings) AS listings,
       (SELECT count(*)::int FROM users) AS users,
       (SELECT count(*)::int FROM scan_requests WHERE status = $1) AS pending_scans,
       (SELECT count(*)::int FROM bookings WHERE created_at >= now() - interval '7 days')
         AS bookings_this_week`,
    [SCAN_STATUS.PENDING],
  );
  const row = rows[0];
  return {
    listings: row.listings,
    users: row.users,
    pendingScans: row.pending_scans,
    bookingsThisWeek: row.bookings_this_week,
  };
}

// Every scan request (or only one status). Oldest first, so the team works through them in order.
// Same fields as ScanRequest, plus sellerFullName for the dashboard's "seller" column.
export async function listScanQueue(status) {
  const { rows } = await query(
    `SELECT s.id, s.listing_id, l.title AS listing_title, s.seller_id, u.full_name AS seller_full_name,
            to_char(s.preferred_date, 'YYYY-MM-DD') AS preferred_date,
            s.scheduled_for, s.notes, s.status, s.created_at
       FROM scan_requests s
       JOIN listings l ON l.id = s.listing_id
       JOIN users u ON u.id = s.seller_id
      WHERE ($1::text IS NULL OR s.status = $1)
      ORDER BY s.created_at, s.id`,
    [status ?? null],
  );
  return {
    items: rows.map((row) => ({
      id: row.id,
      listingId: row.listing_id,
      listingTitle: row.listing_title,
      sellerId: row.seller_id,
      sellerFullName: row.seller_full_name,
      preferredDate: row.preferred_date,
      scheduledFor: row.scheduled_for,
      notes: row.notes,
      status: row.status,
      createdAt: row.created_at,
    })),
  };
}

// Every user (or only one role), newest first. password_hash is never selected.
export async function listUsers(role) {
  const { rows } = await query(
    `SELECT id, full_name, email, phone, role, is_verified, created_at
       FROM users
      WHERE ($1::text IS NULL OR role = $1)
      ORDER BY created_at DESC, id DESC`,
    [role ?? null],
  );
  return {
    items: rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      isVerified: row.is_verified,
      createdAt: row.created_at,
    })),
  };
}

const WEEKS = 8;
const TOP = 5;

// Everything the dashboard charts need, in one round trip. Read-only.
export async function getInsights() {
  const [byDistrict, byType, byStatus, weekly, funnel, bookingsByStatus, top, totals] =
    await Promise.all([
      // Every district appears, even with 0 listings, so the chart keeps its shape
      query(
        `SELECT d.district,
                count(l.id)::int AS total,
                count(l.id) FILTER (WHERE l.status = $2)::int AS live
           FROM unnest($1::text[]) AS d(district)
           LEFT JOIN listings l ON l.district = d.district
          GROUP BY d.district
          ORDER BY total DESC, d.district`,
        [DISTRICTS, LISTING_STATUS.LIVE],
      ),
      query(
        `SELECT t.type, count(l.id)::int AS count,
                COALESCE(round(avg(l.price) FILTER (WHERE l.status = $2)), 0)::float AS avg_price
           FROM unnest($1::text[]) AS t(type)
           LEFT JOIN listings l ON l.type = t.type
          GROUP BY t.type`,
        [Object.values(LISTING_TYPE), LISTING_STATUS.LIVE],
      ),
      query(
        `SELECT s.status, count(l.id)::int AS count
           FROM unnest($1::text[]) AS s(status)
           LEFT JOIN listings l ON l.status = s.status
          GROUP BY s.status`,
        [Object.values(LISTING_STATUS)],
      ),
      // One row per week for the last WEEKS weeks (Monday start), oldest first, 0 when quiet
      query(
        `SELECT to_char(w.week, 'YYYY-MM-DD') AS week_start,
                (SELECT count(*)::int FROM users u
                  WHERE u.created_at >= w.week AND u.created_at < w.week + interval '7 days') AS signups,
                (SELECT count(*)::int FROM bookings b
                  WHERE b.created_at >= w.week AND b.created_at < w.week + interval '7 days') AS bookings,
                (SELECT count(*)::int FROM listings l
                  WHERE l.created_at >= w.week AND l.created_at < w.week + interval '7 days') AS listings
           FROM generate_series(
                  date_trunc('week', now()) - make_interval(weeks => $1 - 1),
                  date_trunc('week', now()),
                  interval '7 days') AS w(week)
          ORDER BY w.week`,
        [WEEKS],
      ),
      query(
        `SELECT s.status, count(r.id)::int AS count
           FROM unnest($1::text[]) WITH ORDINALITY AS s(status, n)
           LEFT JOIN scan_requests r ON r.status = s.status
          GROUP BY s.status, s.n
          ORDER BY s.n`,
        [Object.values(SCAN_STATUS)],
      ),
      query(
        `SELECT s.status, count(b.id)::int AS count
           FROM unnest($1::text[]) AS s(status)
           LEFT JOIN bookings b ON b.status = s.status
          GROUP BY s.status`,
        [Object.values(BOOKING_STATUS)],
      ),
      // Most wanted live listings: saves + bookings + chats.
      // (Wrapped, because Postgres can't ORDER BY a sum of column aliases.)
      query(
        `SELECT * FROM (
           SELECT l.id, l.title, l.district, l.type,
                  (SELECT count(*)::int FROM saved_listings sv WHERE sv.listing_id = l.id) AS saves,
                  (SELECT count(*)::int FROM bookings b WHERE b.listing_id = l.id) AS bookings,
                  (SELECT count(*)::int FROM conversations c WHERE c.listing_id = l.id) AS chats
             FROM listings l
            WHERE l.status = $1
         ) ranked
         ORDER BY saves + bookings + chats DESC, id DESC
         LIMIT $2`,
        [LISTING_STATUS.LIVE, TOP],
      ),
      query(
        `SELECT
           (SELECT count(*)::int FROM listings WHERE tour_url IS NOT NULL) AS with_tour,
           (SELECT count(*)::int FROM users WHERE NOT is_verified) AS unverified,
           (SELECT count(*)::int FROM messages WHERE created_at >= now() - interval '7 days')
             AS messages_this_week,
           (SELECT count(*)::int FROM saved_listings) AS saves`,
      ),
    ]);

  const t = totals.rows[0];
  return {
    listingsByDistrict: byDistrict.rows,
    listingsByType: byType.rows.map((r) => ({
      type: r.type,
      count: r.count,
      avgPrice: r.avg_price,
    })),
    listingsByStatus: byStatus.rows,
    weekly: weekly.rows.map((r) => ({
      weekStart: r.week_start,
      signups: r.signups,
      bookings: r.bookings,
      listings: r.listings,
    })),
    scanFunnel: funnel.rows,
    bookingsByStatus: bookingsByStatus.rows,
    topListings: top.rows,
    totals: {
      withTour: t.with_tour,
      unverifiedUsers: t.unverified,
      messagesThisWeek: t.messages_this_week,
      saves: t.saves,
    },
  };
}

// Every booking on the platform (or one status), newest first, with listing, booker and seller.
export async function listAllBookings(status) {
  const { rows } = await query(
    `SELECT b.id, b.listing_id, b.user_id, b.kind,
            to_char(b.date, 'YYYY-MM-DD') AS date,
            to_char(b.check_out, 'YYYY-MM-DD') AS check_out,
            b.message, b.status, b.created_at,
            l.title AS listing_title, l.type AS listing_type, l.district AS listing_district,
            u.full_name AS user_full_name, s.full_name AS seller_full_name
       FROM bookings b
       JOIN listings l ON l.id = b.listing_id
       JOIN users u ON u.id = b.user_id
       JOIN users s ON s.id = l.seller_id
      WHERE ($1::text IS NULL OR b.status = $1)
      ORDER BY b.created_at DESC, b.id DESC
      LIMIT 200`,
    [status ?? null],
  );
  return {
    items: rows.map((row) => ({
      id: row.id,
      listingId: row.listing_id,
      userId: row.user_id,
      kind: row.kind,
      date: row.date,
      checkOut: row.check_out,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      listing: {
        id: row.listing_id,
        title: row.listing_title,
        type: row.listing_type,
        district: row.listing_district,
      },
      userFullName: row.user_full_name,
      sellerFullName: row.seller_full_name,
    })),
  };
}
