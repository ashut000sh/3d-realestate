// Frontend side of the BOOKINGS module. Shapes: docs/API.md -> BOOKINGS.
import { API, buildPath } from "@realestate/shared";
import { request } from "./api.js";

export const createBooking = (form) =>
  request("POST", API.BOOKINGS.CREATE, { body: form }).then((d) => d.booking);

// as = "seller" returns bookings on MY listings (for the seller's requests panel)
export const getMyBookings = (as) =>
  request("GET", API.BOOKINGS.MINE, { query: { as } }).then((d) => d.items);

export const updateBookingStatus = (id, status) =>
  request("PATCH", buildPath(API.BOOKINGS.UPDATE_STATUS, { id }), { body: { status } }).then(
    (d) => d.booking,
  );

// Blocked dates of a short stay: { from, to, blocked: [{ start, end }] } (end = check-out day, free)
export const getAvailability = (listingId, { from, to } = {}) =>
  request("GET", buildPath(API.LISTINGS.AVAILABILITY, { id: listingId }), {
    query: { from, to },
  });
