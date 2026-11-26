// LISTINGS service: all database queries for this module live here.
// Controllers call these functions; nothing else touches the listings tables.
import { LIMITS, LISTING_STATUS, ROLES, SCAN_STATUS } from "@realestate/shared";
import { query } from "../../config/db.js";
import { httpError } from "../../middleware/errorHandler.js";

// pg returns NUMERIC columns as strings ("32500000.00"), so turn price into a number.
const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

// Columns shared by ListingSummary and Listing. "l" is the listings table.
// The cover image is the photo with the lowest position (0 = cover).
// Exported for other modules that show listing cards (e.g. saved homes)
// Trust badges: tour_verified = our team published a scan of it; seller_verified = an admin
// checked the seller's documents. (SCAN_STATUS.PUBLISHED is a constant, not user input.)
export const SUMMARY_COLUMNS = `
  l.id, l.title, l.type, l.price, l.district, l.lat, l.lng,
  (l.tour_url IS NOT NULL) AS has_tour,
  EXISTS (SELECT 1 FROM scan_requests sr
           WHERE sr.listing_id = l.id AND sr.status = '${SCAN_STATUS.PUBLISHED}') AS tour_verified,
  EXISTS (SELECT 1 FROM users su
           WHERE su.id = l.seller_id AND su.seller_verified_at IS NOT NULL) AS seller_verified,
  (SELECT url FROM listing_images li
    WHERE li.listing_id = l.id
    ORDER BY li.position, li.id LIMIT 1) AS cover_image_url`;

const DETAIL_COLUMNS = `${SUMMARY_COLUMNS},
  l.description, l.address, l.bedrooms, l.bathrooms, l.area_sqft, l.status,
  l.tour_url, l.created_at, l.seller_id,
  u.full_name AS seller_full_name, u.is_verified AS seller_email_verified,
  COALESCE(
    (SELECT json_agg(li.url ORDER BY li.position, li.id)
       FROM listing_images li WHERE li.listing_id = l.id),
    '[]'::json
  ) AS images`;

// Database row -> ListingSummary (docs/API.md)
export function toSummary(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    price: toNumber(row.price),
    district: row.district,
    coverImageUrl: row.cover_image_url ?? null,
    hasTour: row.has_tour,
    tourVerified: row.tour_verified,
    sellerVerified: row.seller_verified,
    lat: row.lat,
    lng: row.lng,
  };
}

// Database row -> Listing (docs/API.md)
function toListing(row) {
  return {
    ...toSummary(row),
    description: row.description,
    address: row.address,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    areaSqft: row.area_sqft,
    status: row.status,
    tourUrl: row.tour_url,
    images: row.images,
    seller: {
      id: row.seller_id,
      fullName: row.seller_full_name,
      verified: row.seller_verified,
      emailVerified: row.seller_email_verified,
    },
    createdAt: row.created_at,
  };
}

// Search. Only live listings are shown to buyers.
// filters: { q, type, district, minPrice, maxPrice, verifiedSeller, page } (checked by the controller)
export async function listListings({
  q,
  type,
  district,
  minPrice,
  maxPrice,
  verifiedSeller,
  page,
}) {
  // Build "WHERE ... AND ..." with $1, $2 parameters. User input never goes into the SQL text.
  const conditions = ["l.status = $1"];
  const params = [LISTING_STATUS.LIVE];
  const add = (sql, value) => {
    params.push(value);
    // every "?" in the snippet becomes the same $n
    conditions.push(sql.replace(/\?/g, `$${params.length}`));
  };

  if (q) add("(l.title ILIKE ? OR l.address ILIKE ?)", `%${q}%`);
  if (type) add("l.type = ?", type);
  if (district) add("l.district = ?", district);
  if (minPrice !== undefined) add("l.price >= ?", minPrice);
  if (maxPrice !== undefined) add("l.price <= ?", maxPrice);
  if (verifiedSeller) {
    conditions.push(
      "EXISTS (SELECT 1 FROM users su WHERE su.id = l.seller_id AND su.seller_verified_at IS NOT NULL)",
    );
  }

  const where = conditions.join(" AND ");

  const countResult = await query(
    `SELECT count(*)::int AS total FROM listings l WHERE ${where}`,
    params,
  );

  const offset = (page - 1) * LIMITS.PAGE_SIZE;
  const { rows } = await query(
    `SELECT ${SUMMARY_COLUMNS}
       FROM listings l
      WHERE ${where}
      ORDER BY l.created_at DESC, l.id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, LIMITS.PAGE_SIZE, offset],
  );

  return { items: rows.map(toSummary), page, total: countResult.rows[0].total };
}

// The seller's own listings in every status, newest first, with what the
// "My listings" page needs: photo count, the latest scan request and open bookings.
export async function listMyListings(sellerId) {
  const { rows } = await query(
    `SELECT ${SUMMARY_COLUMNS}, l.status, l.created_at,
            (SELECT count(*)::int FROM listing_images li WHERE li.listing_id = l.id) AS images_count,
            (SELECT s.status FROM scan_requests s WHERE s.listing_id = l.id
              ORDER BY s.created_at DESC, s.id DESC LIMIT 1) AS scan_status,
            (SELECT count(*)::int FROM bookings b
              WHERE b.listing_id = l.id AND b.status = 'requested') AS pending_bookings,
            (SELECT count(*)::int FROM saved_listings sv WHERE sv.listing_id = l.id) AS saves
       FROM listings l
      WHERE l.seller_id = $1
      ORDER BY l.created_at DESC, l.id DESC`,
    [sellerId],
  );
  return {
    items: rows.map((row) => ({
      ...toSummary(row),
      status: row.status,
      createdAt: row.created_at,
      imagesCount: row.images_count,
      scanStatus: row.scan_status,
      pendingBookings: row.pending_bookings,
      saves: row.saves,
    })),
  };
}

// One full listing, or null if it doesn't exist
async function findListing(id) {
  const { rows } = await query(
    `SELECT ${DETAIL_COLUMNS}
       FROM listings l
       JOIN users u ON u.id = l.seller_id
      WHERE l.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getListing(id) {
  const row = await findListing(id);
  if (!row) throw httpError(404, "Listing not found");
  return { listing: toListing(row) };
}

// GET /api/listings/:id. Live listings are public. Drafts and listings waiting for their scan
// are only shown to their seller and to admins; everyone else gets the same 404 as a
// missing listing, so nobody can tell an unpublished listing exists.
// viewer: { id, role } from the token, or null when not logged in.
export async function getVisibleListing(id, viewer) {
  const row = await findListing(id);
  const canSee =
    row &&
    (row.status === LISTING_STATUS.LIVE ||
      viewer?.id === row.seller_id ||
      viewer?.role === ROLES.ADMIN);
  if (!canSee) throw httpError(404, "Listing not found");
  return { listing: toListing(row) };
}

// Compare up to LIMITS.MAX_COMPARE live listings, returned in the order they were asked for.
export async function compareListings(ids) {
  const { rows } = await query(
    `SELECT ${DETAIL_COLUMNS}
       FROM listings l
       JOIN users u ON u.id = l.seller_id
      WHERE l.id = ANY($1::int[]) AND l.status = $2`,
    [ids, LISTING_STATUS.LIVE],
  );
  const byId = new Map(rows.map((row) => [row.id, row]));
  const items = ids.filter((id) => byId.has(id)).map((id) => toListing(byId.get(id)));
  return { items };
}

// Maps API field names (camelCase) to database columns (snake_case).
// Only these fields can be set by a seller. status, tour_url and seller_id cannot.
const EDITABLE_COLUMNS = {
  title: "title",
  description: "description",
  type: "type",
  price: "price",
  district: "district",
  address: "address",
  lat: "lat",
  lng: "lng",
  bedrooms: "bedrooms",
  bathrooms: "bathrooms",
  areaSqft: "area_sqft",
};

// sellerId always comes from the logged in user (req.user.id), never from the request body.
export async function createListing(sellerId, fields) {
  const keys = Object.keys(EDITABLE_COLUMNS).filter((key) => fields[key] !== undefined);
  const columns = ["seller_id", "status", ...keys.map((key) => EDITABLE_COLUMNS[key])];
  const values = [sellerId, LISTING_STATUS.DRAFT, ...keys.map((key) => fields[key])];
  const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

  const { rows } = await query(
    `INSERT INTO listings (${columns.join(", ")}) VALUES (${placeholders}) RETURNING id`,
    values,
  );
  return getListing(rows[0].id);
}

// Only the seller who owns the listing may edit it.
export async function updateListing(listingId, sellerId, fields) {
  await assertOwner(listingId, sellerId);

  const keys = Object.keys(EDITABLE_COLUMNS).filter((key) => fields[key] !== undefined);
  if (keys.length > 0) {
    const sets = keys.map((key, i) => `${EDITABLE_COLUMNS[key]} = $${i + 1}`);
    const values = keys.map((key) => fields[key]);
    await query(`UPDATE listings SET ${sets.join(", ")} WHERE id = $${values.length + 1}`, [
      ...values,
      listingId,
    ]);
  }
  return getListing(listingId);
}

// 404 if the listing doesn't exist, 403 if it belongs to someone else.
// Also used by the photo upload (Task 6).
export async function assertOwner(listingId, sellerId) {
  const { rows } = await query("SELECT seller_id FROM listings WHERE id = $1", [listingId]);
  if (rows.length === 0) throw httpError(404, "Listing not found");
  if (rows[0].seller_id !== sellerId) throw httpError(403, "You can only edit your own listings");
}

// Saves uploaded photos to listing_images after the ones already there.
// The first photo ever uploaded gets position 0, so it becomes the cover.
// files: [{ url }] in upload order. Returns { images: string[] } (all URLs, cover first).
export async function addImages(listingId, files) {
  const { rows } = await query(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next FROM listing_images WHERE listing_id = $1",
    [listingId],
  );
  const start = rows[0].next;

  const values = [];
  const params = [];
  files.forEach((file, i) => {
    params.push(listingId, file.url, start + i);
    const n = params.length;
    values.push(`($${n - 2}, $${n - 1}, $${n})`);
  });
  await query(
    `INSERT INTO listing_images (listing_id, url, position) VALUES ${values.join(", ")}`,
    params,
  );

  const all = await query(
    "SELECT url FROM listing_images WHERE listing_id = $1 ORDER BY position, id",
    [listingId],
  );
  return { images: all.rows.map((row) => row.url) };
}
