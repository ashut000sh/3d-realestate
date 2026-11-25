// SCANS controllers: read the request, call the service, send the response.
// No SQL in here. Database work belongs in scans.service.js.
import { SCAN_STATUS } from "@realestate/shared";
import { httpError } from "../../middleware/errorHandler.js";
import * as scansService from "./scans.service.js";
import { isGlbFile, moveIntoPlace, receiveTour, removeFile, tourFileUrl } from "./scans.upload.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// POST /api/scan-requests   (seller)
// in:  { listingId, preferredDate, notes }
// out: 201 { scanRequest: ScanRequest }
export async function create(req, res) {
  const { listingId, preferredDate, notes } = req.body ?? {};
  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    throw httpError(400, "notes must be text");
  }
  const result = await scansService.createScanRequest(req.user.id, {
    listingId: readId(listingId, "listingId"),
    preferredDate: readFutureDate(preferredDate, "preferredDate"),
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
  });
  res.status(201).json(result);
}

// GET /api/scan-requests/mine   (seller)
// in:  -
// out: 200 { items: ScanRequest[] }
export async function mine(req, res) {
  res.json(await scansService.listMyScanRequests(req.user.id));
}

// PATCH /api/scan-requests/:id/status   (admin)
// in:  { status, scheduledFor? }
// out: 200 { scanRequest: ScanRequest }
export async function updateStatus(req, res) {
  const id = readId(req.params.id, "id");
  const { status, scheduledFor } = req.body ?? {};
  if (!Object.values(SCAN_STATUS).includes(status)) {
    throw httpError(400, `status must be one of: ${Object.values(SCAN_STATUS).join(", ")}`);
  }

  let when = null;
  if (status === SCAN_STATUS.SCHEDULED) {
    const date = new Date(scheduledFor);
    if (typeof scheduledFor !== "string" || Number.isNaN(date.getTime())) {
      throw httpError(400, "scheduledFor is required, for example 2026-12-01T10:00:00+05:45");
    }
    if (date < new Date()) throw httpError(400, "scheduledFor can't be in the past");
    when = date.toISOString();
  }

  res.json(await scansService.updateScanStatus(id, { status, scheduledFor: when }));
}

// POST /api/scan-requests/:id/tour   (admin)
// in:  multipart/form-data: file (.glb)
// out: 200 { tourUrl }
// Steps, in this order:
//   1. check the request exists and is scheduled or scanned (before the file is saved)
//   2. multer saves the file under a temporary name
//   3. check it really is a .glb, move it to tours/<listingId>.glb, publish
export const uploadTour = [
  async function checkRequest(req, _res, next) {
    req.scanRequest = await scansService.getRequestForTourUpload(readId(req.params.id, "id"));
    next();
  },
  receiveTour,
  async function publish(req, res) {
    const file = req.file;
    if (!file) throw httpError(400, 'Choose a .glb file (field name "file")');

    const { id, listingId } = req.scanRequest;
    try {
      if (!(await isGlbFile(file.path))) {
        throw httpError(400, "This file is not a real .glb 3D model");
      }
      await moveIntoPlace(file, listingId);
    } catch (err) {
      removeFile(file);
      throw err;
    }
    // ?v= makes browsers load the new file instead of an old cached tour
    res.json(
      await scansService.publishTour(id, listingId, `${tourFileUrl(listingId)}?v=${Date.now()}`),
    );
  },
];

// ---------- input checks ----------

function readId(value, name) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, `${name} must be a positive number`);
  return id;
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
