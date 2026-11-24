// ADMIN service: all database queries for this module live here.
// Read-only: admin CHANGES to scan requests go through the scans module.
import { SCAN_STATUS } from "@realestate/shared";
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
