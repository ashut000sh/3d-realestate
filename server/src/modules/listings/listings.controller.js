// LISTINGS controllers: read the request, call the service, send the response.
// No SQL in here. Database work belongs in listings.service.js.
import { DISTRICTS, LIMITS, LISTING_TYPE } from "@realestate/shared";
import { httpError } from "../../middleware/errorHandler.js";
import * as listingsService from "./listings.service.js";
import { listingFileUrl, receiveImages, removeFiles } from "./listings.upload.js";

const LISTING_TYPES = Object.values(LISTING_TYPE);

// GET /api/listings   (public)
// in:  query: ?q, type, minPrice, maxPrice, district, page
// out: 200 { items: ListingSummary[], page, total }
export async function list(req, res) {
  const { q, type, district, minPrice, maxPrice, page } = req.query;

  if (type && !LISTING_TYPES.includes(type)) {
    throw httpError(400, `type must be one of: ${LISTING_TYPES.join(", ")}`);
  }
  if (district && !DISTRICTS.includes(district)) {
    throw httpError(400, `district must be one of: ${DISTRICTS.join(", ")}`);
  }
  const filters = {
    q: typeof q === "string" ? q.trim() : "",
    type: type || undefined,
    district: district || undefined,
    minPrice: readOptionalNumber(minPrice, "minPrice"),
    maxPrice: readOptionalNumber(maxPrice, "maxPrice"),
    page: page === undefined || page === "" ? 1 : readId(page, "page"),
  };
  if (
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.minPrice > filters.maxPrice
  ) {
    throw httpError(400, "minPrice cannot be more than maxPrice");
  }

  res.json(await listingsService.listListings(filters));
}

// GET /api/listings/compare   (public)
// in:  query: ?ids=1,2,3 (max 3)
// out: 200 { items: Listing[] }
export async function compare(req, res) {
  const raw = typeof req.query.ids === "string" ? req.query.ids : "";
  const parts = raw.split(",").filter((part) => part.trim() !== "");
  if (parts.length === 0) throw httpError(400, "ids is required, for example ?ids=1,2,3");
  if (parts.length > LIMITS.MAX_COMPARE) {
    throw httpError(400, `You can compare at most ${LIMITS.MAX_COMPARE} listings`);
  }
  const ids = [...new Set(parts.map((part) => readId(part.trim(), "ids")))];
  res.json(await listingsService.compareListings(ids));
}

// GET /api/listings/:id   (public)
// in:  -
// out: 200 { listing: Listing }
export async function one(req, res) {
  res.json(await listingsService.getListing(readId(req.params.id, "id")));
}

// POST /api/listings   (seller)
// in:  { title, description, type, price, district, address, lat, lng, bedrooms, bathrooms, areaSqft }
// out: 201 { listing: Listing }
export async function create(req, res) {
  const fields = readListingFields(req.body ?? {}, { isCreate: true });
  // seller comes from the token, never from the body
  const result = await listingsService.createListing(req.user.id, fields);
  res.status(201).json(result);
}

// PATCH /api/listings/:id   (owner seller)
// in:  any CREATE fields
// out: 200 { listing: Listing }
export async function update(req, res) {
  const id = readId(req.params.id, "id");
  const fields = readListingFields(req.body ?? {}, { isCreate: false });
  res.json(await listingsService.updateListing(id, req.user.id, fields));
}

// POST /api/listings/:id/images   (owner seller)
// in:  multipart/form-data: images (1 to 10 .jpg/.png files, max 5 MB each)
// out: 200 { images: string[] }   (all image URLs for the listing, first one is the cover)
// Three steps, in this order:
//   1. check the listing exists and belongs to this seller (before any file is saved)
//   2. multer saves the files to server/uploads/listings/<id>/
//   3. store their URLs in listing_images
export const uploadImages = [
  async function checkOwner(req, _res, next) {
    await listingsService.assertOwner(readId(req.params.id, "id"), req.user.id);
    next();
  },
  receiveImages,
  async function saveImages(req, res) {
    const listingId = readId(req.params.id, "id");
    const files = req.files ?? [];
    if (files.length === 0) throw httpError(400, 'Choose at least 1 photo (field name "images")');
    try {
      const result = await listingsService.addImages(
        listingId,
        files.map((file) => ({ url: listingFileUrl(listingId, file.filename) })),
      );
      res.json(result);
    } catch (err) {
      removeFiles(files); // don't leave files on disk that the database doesn't know about
      throw err;
    }
  },
];

// ---------- input checks ----------

// Checks the listing fields in the body. On create, title/type/price/district are required.
// On update, every field is optional but must be valid if sent.
// Returns only the fields that were sent, in API (camelCase) names.
function readListingFields(body, { isCreate }) {
  const fields = {};
  const has = (key) => body[key] !== undefined;

  if (isCreate || has("title")) {
    if (typeof body.title !== "string" || body.title.trim().length < 3) {
      throw httpError(400, "Title must be at least 3 characters");
    }
    fields.title = body.title.trim();
  }
  if (isCreate || has("type")) {
    if (!LISTING_TYPES.includes(body.type)) {
      throw httpError(400, `type must be one of: ${LISTING_TYPES.join(", ")}`);
    }
    fields.type = body.type;
  }
  if (isCreate || has("price")) {
    const price = Number(body.price);
    if (body.price === null || body.price === "" || !Number.isFinite(price) || price <= 0) {
      throw httpError(400, "Price must be a number above 0");
    }
    fields.price = price;
  }
  if (isCreate || has("district")) {
    if (!DISTRICTS.includes(body.district)) {
      throw httpError(400, `district must be one of: ${DISTRICTS.join(", ")}`);
    }
    fields.district = body.district;
  }

  for (const key of ["description", "address"]) {
    if (has(key)) {
      if (body[key] !== null && typeof body[key] !== "string") {
        throw httpError(400, `${key} must be text`);
      }
      fields[key] = body[key] === null ? null : body[key].trim();
    }
  }

  if (has("lat")) fields.lat = readNullableNumber(body.lat, "lat", -90, 90);
  if (has("lng")) fields.lng = readNullableNumber(body.lng, "lng", -180, 180);

  for (const key of ["bedrooms", "bathrooms", "areaSqft"]) {
    if (has(key)) {
      const value = body[key];
      if (value === null) {
        fields[key] = null;
      } else if (!Number.isInteger(Number(value)) || Number(value) < 0 || value === "") {
        throw httpError(400, `${key} must be a whole number, 0 or more`);
      } else {
        fields[key] = Number(value);
      }
    }
  }

  if (!isCreate && Object.keys(fields).length === 0) {
    throw httpError(400, "Send at least one field to change");
  }
  return fields;
}

// "7" -> 7. Anything that isn't a positive whole number -> 400.
function readId(value, name) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, `${name} must be a positive number`);
  return id;
}

// Query string number that may be left out: "" or missing -> undefined.
function readOptionalNumber(value, name) {
  if (value === undefined || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw httpError(400, `${name} must be a number`);
  return number;
}

// Body number that may be null (to clear it), within min..max.
function readNullableNumber(value, name, min, max) {
  if (value === null) return null;
  const number = Number(value);
  if (value === "" || !Number.isFinite(number) || number < min || number > max) {
    throw httpError(400, `${name} must be a number between ${min} and ${max}`);
  }
  return number;
}
