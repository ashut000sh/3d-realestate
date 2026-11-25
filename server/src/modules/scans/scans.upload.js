// 3D tour upload (multer). Saves the file as server/uploads/tours/<listingId>.glb.
// The URL stored in listings.tour_url is /uploads/tours/<listingId>.glb, which app.js serves.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { httpError } from "../../middleware/errorHandler.js";

// Size limit agreed with Ashutosh Ghimire (docs/3D-PIPELINE.md): optimised tours stay under 50 MB.
// If the pipeline doc changes the number, change it here too.
export const MAX_TOUR_MB = 50;

// server/uploads/tours (this file is in server/src/modules/scans/)
const TOURS_FOLDER = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../uploads/tours",
);

export const tourFileUrl = (listingId) => `/uploads/tours/${listingId}.glb`;

// req.scanRequest is set by the step before this one (the request is checked first)
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    fs.mkdir(TOURS_FOLDER, { recursive: true }, (err) => cb(err, TOURS_FOLDER));
  },
  // Saved under a temporary name; renamed to <listingId>.glb only after the checks pass,
  // so a bad upload never replaces a tour that already works.
  filename(req, _file, cb) {
    cb(null, `${req.scanRequest.listingId}.uploading-${Date.now()}.glb`);
  },
});

const parseTour = multer({
  storage,
  limits: { fileSize: MAX_TOUR_MB * 1024 * 1024, files: 1 },
  fileFilter(_req, file, cb) {
    // Browsers send .glb with different MIME types, so check the extension here
    // and the file's first bytes after it is saved.
    if (path.extname(file.originalname).toLowerCase() !== ".glb") {
      return cb(httpError(400, "Only .glb files are allowed"));
    }
    cb(null, true);
  },
}).single("file");

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: `The tour must be ${MAX_TOUR_MB} MB or smaller. Optimise it first (docs/3D-PIPELINE.md)`,
  LIMIT_FILE_COUNT: "Send one .glb file",
  LIMIT_UNEXPECTED_FILE: 'Send the .glb in the "file" field',
};

// Express middleware: reads the "file" field into req.file
export function receiveTour(req, res, next) {
  parseTour(req, res, (err) => {
    if (!err) return next();
    removeFile(req.file);
    if (err instanceof multer.MulterError) {
      return next(httpError(400, MULTER_MESSAGES[err.code] ?? "Upload failed"));
    }
    next(err);
  });
}

// Every .glb file starts with the 4 bytes "glTF". Renamed text or images don't.
export async function isGlbFile(filePath) {
  const handle = await fs.promises.open(filePath, "r");
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(4), 0, 4, 0);
    return bytesRead === 4 && buffer.toString("ascii") === "glTF";
  } finally {
    await handle.close();
  }
}

// Temporary file -> <listingId>.glb (replaces an older tour for the same listing)
export async function moveIntoPlace(file, listingId) {
  await fs.promises.rename(file.path, path.join(TOURS_FOLDER, `${listingId}.glb`));
}

export function removeFile(file) {
  if (file?.path) fs.rm(file.path, { force: true }, () => {});
}
