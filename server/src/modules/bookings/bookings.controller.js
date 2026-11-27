// BOOKINGS controllers: read the request, call the service, send the response.
// No SQL in here. Database work belongs in bookings.service.js.
import { AVAILABILITY, BOOKING_KIND, BOOKING_STATUS } from "@realestate/shared";
import { verifyToken } from "../../middleware/auth.js";
import { httpError } from "../../middleware/errorHandler.js";
import * as bookingsService from "./bookings.service.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_MESSAGE_LENGTH = 1000;

// POST /api/bookings   (logged in)
// in:  { listingId, kind: "viewing" | "stay", date, checkOut?, message }
// out: 201 { booking: Booking }
export async function create(req, res) {
  const { listingId, kind, date, checkOut, message } = req.body ?? {};

  if (!Object.values(BOOKING_KIND).includes(kind)) {
    throw httpError(400, `kind must be one of: ${Object.values(BOOKING_KIND).join(", ")}`);
  }
  const startDate = readFutureDate(date, "date");
  let endDate = null;
  if (kind === BOOKING_KIND.STAY) {
    endDate = readFutureDate(checkOut, "checkOut");
    if (endDate <= startDate) throw httpError(400, "checkOut must be after the check-in date");
  }
  if (message !== undefined && message !== null && typeof message !== "string") {
    throw httpError(400, "message must be text");
  }
  if (typeof message === "string" && message.length > MAX_MESSAGE_LENGTH) {
    throw httpError(400, `message can be at most ${MAX_MESSAGE_LENGTH} characters`);
  }

  const result = await bookingsService.createBooking(req.user.id, {
    listingId: readId(listingId, "listingId"),
    kind,
    date: startDate,
    checkOut: endDate,
    message: typeof message === "string" && message.trim() ? message.trim() : null,
  });
  res.status(201).json(result);
}

// GET /api/listings/:id/availability   (public)
// in:  query: ?from=YYYY-MM-DD&to=YYYY-MM-DD   (default: today to AVAILABILITY.DEFAULT_MONTHS ahead,
//      at most AVAILABILITY.MAX_MONTHS between them; `to` is exclusive)
// out: 200 { from, to, blocked: [{ start, end }] }   dates only, never who booked
//      400 if the listing is not a short stay; 404 if it can't be seen (same rule as GET /listings/:id)
export async function availability(req, res) {
  const id = readId(req.params.id, "id");
  const today = new Date().toISOString().slice(0, 10);
  const from = req.query.from === undefined ? today : readDate(req.query.from, "from");
  const to =
    req.query.to === undefined
      ? addMonths(from, AVAILABILITY.DEFAULT_MONTHS)
      : readDate(req.query.to, "to");
  if (to <= from) throw httpError(400, "to must be after from");
  if (to > addMonths(from, AVAILABILITY.MAX_MONTHS)) {
    throw httpError(400, `Ask for at most ${AVAILABILITY.MAX_MONTHS} months at a time`);
  }

  // Public route: the token is optional (lets a seller see the calendar of their own draft)
  const header = req.headers.authorization ?? "";
  const viewer = header.startsWith("Bearer ") ? verifyToken(header.slice(7)) : null;
  res.json(await bookingsService.getAvailability(id, from, to, viewer));
}

// GET /api/bookings/mine   (logged in)
// in:  query: ?as=seller (bookings on my listings instead of bookings I made)
// out: 200 { items: Booking[] }
export async function mine(req, res) {
  const { as } = req.query;
  if (as !== undefined && as !== "seller") throw httpError(400, 'as can only be "seller"');
  res.json(await bookingsService.listMyBookings(req.user.id, as === "seller"));
}

// PATCH /api/bookings/:id/status   (listing owner)
// in:  { status }
// out: 200 { booking: Booking }
export async function updateStatus(req, res) {
  const id = readId(req.params.id, "id");
  const { status } = req.body ?? {};
  const allowed = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.DECLINED, BOOKING_STATUS.CANCELLED];
  if (!allowed.includes(status)) {
    throw httpError(400, `status must be one of: ${allowed.join(", ")}`);
  }
  res.json(await bookingsService.updateBookingStatus(id, req.user.id, status));
}

// ---------- input checks ----------

function readId(value, name) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, `${name} must be a positive number`);
  return id;
}

// "YYYY-MM-DD" that is a real calendar date (2026-02-30 is rejected)
function readDate(value, name) {
  const valid =
    typeof value === "string" &&
    DATE_PATTERN.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if (!valid) throw httpError(400, `${name} must be a date like 2026-12-01`);
  return value;
}

// "2026-01-31" + 1 month -> "2026-02-28" (clamped to the end of the month)
function addMonths(value, months) {
  const [y, m, d] = value.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

// "YYYY-MM-DD", today or later
function readFutureDate(value, name) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    throw httpError(400, `${name} must be a date like 2026-12-01`);
  }
  const today = new Date().toISOString().slice(0, 10);
  if (value < today) throw httpError(400, `${name} can't be in the past`);
  return value;
}
