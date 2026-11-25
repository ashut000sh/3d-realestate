// SCANS service: all database queries for this module live here.
// Controllers call these functions; nothing else touches the scans tables.
import { LISTING_STATUS, SCAN_STATUS } from "@realestate/shared";
import { query } from "../../config/db.js";
import { httpError } from "../../middleware/errorHandler.js";

// Columns for a ScanRequest (docs/API.md). "s" = scan_requests, "l" = listings.
// preferred_date is a DATE: send it as "YYYY-MM-DD" text, so time zones can't shift it a day.
const SCAN_COLUMNS = `
  s.id, s.listing_id, l.title AS listing_title, s.seller_id,
  to_char(s.preferred_date, 'YYYY-MM-DD') AS preferred_date,
  s.scheduled_for, s.notes, s.status, s.created_at`;

// Database row -> ScanRequest
function toScanRequest(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    sellerId: row.seller_id,
    preferredDate: row.preferred_date,
    scheduledFor: row.scheduled_for,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

// A request that is still being worked on (not finished and not cancelled)
const OPEN_STATUSES = [SCAN_STATUS.PENDING, SCAN_STATUS.SCHEDULED, SCAN_STATUS.SCANNED];

// Which status the admin may move to from each status with PATCH .../status.
// "published" is NOT here: a request is published only by uploading its tour.
const NEXT_STATUSES = {
  [SCAN_STATUS.PENDING]: [SCAN_STATUS.SCHEDULED, SCAN_STATUS.CANCELLED],
  // scheduled -> scheduled lets the admin move the visit to another date
  [SCAN_STATUS.SCHEDULED]: [SCAN_STATUS.SCHEDULED, SCAN_STATUS.SCANNED, SCAN_STATUS.CANCELLED],
  [SCAN_STATUS.SCANNED]: [SCAN_STATUS.CANCELLED],
  [SCAN_STATUS.PUBLISHED]: [],
  [SCAN_STATUS.CANCELLED]: [],
};

export async function getScanRequest(id) {
  const { rows } = await query(
    `SELECT ${SCAN_COLUMNS} FROM scan_requests s JOIN listings l ON l.id = s.listing_id
      WHERE s.id = $1`,
    [id],
  );
  if (rows.length === 0) throw httpError(404, "Scan request not found");
  return toScanRequest(rows[0]);
}

// Seller asks us to scan one of their listings.
export async function createScanRequest(sellerId, { listingId, preferredDate, notes }) {
  const listing = await query("SELECT seller_id FROM listings WHERE id = $1", [listingId]);
  if (listing.rows.length === 0) throw httpError(404, "Listing not found");
  if (listing.rows[0].seller_id !== sellerId) {
    throw httpError(403, "You can only request a scan for your own listing");
  }

  const open = await query(
    "SELECT 1 FROM scan_requests WHERE listing_id = $1 AND status = ANY($2::text[])",
    [listingId, OPEN_STATUSES],
  );
  if (open.rows.length > 0) {
    throw httpError(409, "This listing already has a scan request in progress");
  }

  // One statement, so the request and the listing status change together or not at all.
  const { rows } = await query(
    `WITH new_request AS (
       INSERT INTO scan_requests (listing_id, seller_id, preferred_date, notes, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id
     ), listing_update AS (
       UPDATE listings SET status = $6 WHERE id = $1 AND status <> $7
     )
     SELECT id FROM new_request`,
    [
      listingId,
      sellerId,
      preferredDate,
      notes,
      SCAN_STATUS.PENDING,
      LISTING_STATUS.AWAITING_SCAN,
      LISTING_STATUS.LIVE, // a live listing asking for a new scan stays live
    ],
  );
  return { scanRequest: await getScanRequest(rows[0].id) };
}

// The logged in seller's requests, newest first
export async function listMyScanRequests(sellerId) {
  const { rows } = await query(
    `SELECT ${SCAN_COLUMNS} FROM scan_requests s JOIN listings l ON l.id = s.listing_id
      WHERE s.seller_id = $1
      ORDER BY s.created_at DESC, s.id DESC`,
    [sellerId],
  );
  return { items: rows.map(toScanRequest) };
}

// Admin moves a request along. scheduledFor is required for "scheduled".
export async function updateScanStatus(id, { status, scheduledFor }) {
  const current = await getScanRequest(id);
  const allowed = NEXT_STATUSES[current.status] ?? [];

  if (status === SCAN_STATUS.PUBLISHED) {
    throw httpError(400, "Upload the 3D tour to publish this request");
  }
  if (!allowed.includes(status)) {
    throw httpError(400, `Can't change a ${current.status} request to ${status}`);
  }

  if (status === SCAN_STATUS.CANCELLED) {
    // Cancelling puts a listing that was waiting for its scan back to draft.
    await query(
      `WITH request_update AS (
         UPDATE scan_requests SET status = $2 WHERE id = $1 RETURNING listing_id
       )
       UPDATE listings SET status = $3
        WHERE id = (SELECT listing_id FROM request_update) AND status = $4`,
      [id, status, LISTING_STATUS.DRAFT, LISTING_STATUS.AWAITING_SCAN],
    );
  } else if (status === SCAN_STATUS.SCHEDULED) {
    await query("UPDATE scan_requests SET status = $2, scheduled_for = $3 WHERE id = $1", [
      id,
      status,
      scheduledFor,
    ]);
  } else {
    await query("UPDATE scan_requests SET status = $2 WHERE id = $1", [id, status]);
  }
  return { scanRequest: await getScanRequest(id) };
}

// Checks a tour can be uploaded for this request and returns it. Used BEFORE the file is saved.
export async function getRequestForTourUpload(id) {
  const request = await getScanRequest(id);
  if (request.status !== SCAN_STATUS.SCHEDULED && request.status !== SCAN_STATUS.SCANNED) {
    throw httpError(400, `Can't upload a tour for a ${request.status} request`);
  }
  return request;
}

// After the .glb is saved: attach it to the listing, make the listing live
// and mark the request published, all in one statement.
export async function publishTour(requestId, listingId, tourUrl) {
  await query(
    `WITH request_update AS (
       UPDATE scan_requests SET status = $2 WHERE id = $1
     )
     UPDATE listings SET tour_url = $4, status = $5 WHERE id = $3`,
    [requestId, SCAN_STATUS.PUBLISHED, listingId, tourUrl, LISTING_STATUS.LIVE],
  );
  return { tourUrl };
}
