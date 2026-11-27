// BOOKINGS service: all database queries for this module live here.
// Controllers call these functions; nothing else touches the bookings table.
import {
  AVAILABILITY,
  BOOKING_KIND,
  BOOKING_STATUS,
  LISTING_STATUS,
  LISTING_TYPE,
} from "@realestate/shared";
import { query } from "../../config/db.js";
import { httpError } from "../../middleware/errorHandler.js";
import { getVisibleListing } from "../listings/listings.service.js";

// Columns for a Booking (docs/API.md). DATE columns go out as "YYYY-MM-DD" text,
// so time zones can never shift them by a day. Always used with BOOKING_FROM, which adds
// the listing (title, photo, type) and the person who booked, so screens never show bare ids.
const BOOKING_COLUMNS = `
  b.id, b.listing_id, b.user_id, b.kind,
  to_char(b.date, 'YYYY-MM-DD') AS date,
  to_char(b.check_out, 'YYYY-MM-DD') AS check_out,
  b.message, b.status, b.created_at,
  l.title AS listing_title, l.type AS listing_type, l.district AS listing_district,
  l.price AS listing_price,
  (SELECT url FROM listing_images li WHERE li.listing_id = l.id
    ORDER BY li.position, li.id LIMIT 1) AS listing_cover_url,
  u.full_name AS user_full_name`;

const BOOKING_FROM = `
  bookings b
  JOIN listings l ON l.id = b.listing_id
  JOIN users u ON u.id = b.user_id`;

function toBooking(row) {
  return {
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
      price: row.listing_price === null ? null : Number(row.listing_price),
      coverImageUrl: row.listing_cover_url ?? null,
    },
    userFullName: row.user_full_name,
  };
}

async function getBooking(id) {
  const { rows } = await query(`SELECT ${BOOKING_COLUMNS} FROM ${BOOKING_FROM} WHERE b.id = $1`, [
    id,
  ]);
  if (rows.length === 0) throw httpError(404, "Booking not found");
  return toBooking(rows[0]);
}

// 409 if a CONFIRMED stay on this listing overlaps the nights date..checkOut.
// (Check-out day = someone else's check-in day is fine.)
async function assertNoOverlappingStay(listingId, date, checkOut, ignoreBookingId = null) {
  const { rows } = await query(
    `SELECT 1 FROM bookings
      WHERE listing_id = $1 AND kind = $2 AND status = $3
        AND date < $5 AND check_out > $4
        AND ($6::int IS NULL OR id <> $6)
      LIMIT 1`,
    [listingId, BOOKING_KIND.STAY, BOOKING_STATUS.CONFIRMED, date, checkOut, ignoreBookingId],
  );
  if (rows.length > 0) throw httpError(409, "These dates are already booked");
}

// fields: { listingId, kind, date, checkOut, message } (format already checked by the controller)
export async function createBooking(userId, { listingId, kind, date, checkOut, message }) {
  const { rows } = await query("SELECT seller_id, type, status FROM listings WHERE id = $1", [
    listingId,
  ]);
  const listing = rows[0];
  if (!listing || listing.status !== LISTING_STATUS.LIVE) {
    throw httpError(404, "Listing not found");
  }
  if (listing.seller_id === userId) throw httpError(400, "You can't book your own listing");

  if (kind === BOOKING_KIND.STAY) {
    if (listing.type !== LISTING_TYPE.SHORT_STAY) {
      throw httpError(400, "Stays can only be booked on short stay listings");
    }
    await assertNoOverlappingStay(listingId, date, checkOut);
  }

  const inserted = await query(
    `INSERT INTO bookings (listing_id, user_id, kind, date, check_out, message, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      listingId,
      userId,
      kind,
      date,
      kind === BOOKING_KIND.STAY ? checkOut : null,
      message,
      BOOKING_STATUS.REQUESTED,
    ],
  );
  return { booking: await getBooking(inserted.rows[0].id) };
}

// Blocked nights of a short-stay listing between from and to ("YYYY-MM-DD", to exclusive).
// Only dates go out: no booking ids, guest names or statuses. Touching or overlapping stays are
// merged into one range, so the calendar doesn't even show how many bookings there are.
// Each range is { start, end }: nights start..end-1 are taken; `end` is the check-out day, which
// is free for a new guest to check in.
// viewer = { id, role } | null: same visibility rule as GET /api/listings/:id.
export async function getAvailability(listingId, from, to, viewer) {
  const { listing } = await getVisibleListing(listingId, viewer);
  if (listing.type !== LISTING_TYPE.SHORT_STAY) {
    throw httpError(400, "Availability is only for short stay listings");
  }

  const { rows } = await query(
    `SELECT to_char(date, 'YYYY-MM-DD') AS start, to_char(check_out, 'YYYY-MM-DD') AS "end"
       FROM bookings
      WHERE listing_id = $1 AND kind = $2 AND status = ANY($3::text[])
        AND check_out IS NOT NULL AND date < $5 AND check_out > $4
      ORDER BY date, check_out`,
    [listingId, BOOKING_KIND.STAY, AVAILABILITY.BLOCKING_STATUSES, from, to],
  );

  const blocked = [];
  for (const { start, end } of rows) {
    const last = blocked[blocked.length - 1];
    if (last && start <= last.end) {
      if (end > last.end) last.end = end; // touching or overlapping: extend
    } else {
      blocked.push({ start, end });
    }
  }
  return { from, to, blocked };
}

// asSeller = false: bookings I made. asSeller = true: bookings on listings I own.
export async function listMyBookings(userId, asSeller) {
  const { rows } = await query(
    asSeller
      ? `SELECT ${BOOKING_COLUMNS} FROM ${BOOKING_FROM}
          WHERE l.seller_id = $1 ORDER BY b.created_at DESC, b.id DESC`
      : `SELECT ${BOOKING_COLUMNS} FROM ${BOOKING_FROM}
          WHERE b.user_id = $1 ORDER BY b.date DESC, b.id DESC`,
    [userId],
  );
  return { items: rows.map(toBooking) };
}

// Who may change a booking, and to what:
//   listing owner: requested -> confirmed or declined
//   person who booked: requested or confirmed -> cancelled
//   anyone else: 403
export async function updateBookingStatus(bookingId, userId, status) {
  const { rows } = await query(
    `SELECT b.user_id, b.listing_id, b.kind, b.status,
            to_char(b.date, 'YYYY-MM-DD') AS date, to_char(b.check_out, 'YYYY-MM-DD') AS check_out,
            l.seller_id
       FROM bookings b JOIN listings l ON l.id = b.listing_id
      WHERE b.id = $1`,
    [bookingId],
  );
  const booking = rows[0];
  if (!booking) throw httpError(404, "Booking not found");

  const isOwner = booking.seller_id === userId;
  const isBooker = booking.user_id === userId;
  if (!isOwner && !isBooker) throw httpError(403, "You can't change this booking");

  if (status === BOOKING_STATUS.CONFIRMED || status === BOOKING_STATUS.DECLINED) {
    if (!isOwner) throw httpError(403, "Only the listing owner can confirm or decline");
    if (booking.status !== BOOKING_STATUS.REQUESTED) {
      throw httpError(400, `This booking is already ${booking.status}`);
    }
    if (status === BOOKING_STATUS.CONFIRMED && booking.kind === BOOKING_KIND.STAY) {
      await assertNoOverlappingStay(booking.listing_id, booking.date, booking.check_out, bookingId);
    }
  } else if (status === BOOKING_STATUS.CANCELLED) {
    if (!isBooker) throw httpError(403, "Only the person who booked can cancel");
    if (
      booking.status !== BOOKING_STATUS.REQUESTED &&
      booking.status !== BOOKING_STATUS.CONFIRMED
    ) {
      throw httpError(400, `This booking is already ${booking.status}`);
    }
  } else {
    throw httpError(400, "status must be confirmed, declined or cancelled");
  }

  await query("UPDATE bookings SET status = $2 WHERE id = $1", [bookingId, status]);
  return { booking: await getBooking(bookingId) };
}
