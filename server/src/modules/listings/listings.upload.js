// Photo upload for listings (multer). Saves files to server/uploads/listings/<listingId>/.
// The URL stored in listing_images is /uploads/listings/<listingId>/<file>, which app.js serves.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { httpError } from "../../middleware/errorHandler.js";

export const MAX_IMAGES_PER_UPLOAD = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// server/uploads (this file is in server/src/modules/listings/)
export const UPLOADS_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../uploads",
);

const ALLOWED = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export const listingFolder = (listingId) => path.join(UPLOADS_ROOT, "listings", String(listingId));
export const listingFileUrl = (listingId, fileName) => `/uploads/listings/${listingId}/${fileName}`;

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const folder = listingFolder(req.params.id);
    fs.mkdir(folder, { recursive: true }, (err) => cb(err, folder));
  },
  // Random name so two photos called "IMG_001.jpg" never overwrite each other
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomBytes(12).toString("hex")}${ext === ".jpeg" ? ".jpg" : ext}`);
  },
});

const parseImages = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: MAX_IMAGES_PER_UPLOAD },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED[file.mimetype]?.includes(ext)) {
      return cb(httpError(400, "Only .jpg and .png photos are allowed"));
    }
    cb(null, true);
  },
}).array("images", MAX_IMAGES_PER_UPLOAD);

// multer error codes -> friendly 400 messages
const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: "Each photo must be 5 MB or smaller",
  LIMIT_FILE_COUNT: `You can upload at most ${MAX_IMAGES_PER_UPLOAD} photos at once`,
  LIMIT_UNEXPECTED_FILE: `Send photos in the "images" field, at most ${MAX_IMAGES_PER_UPLOAD}`,
};

// Express middleware: reads the "images" field into req.files.
// If anything goes wrong, files already saved by this request are deleted.
export function receiveImages(req, res, next) {
  parseImages(req, res, (err) => {
    if (!err) return next();
    removeFiles(req.files);
    if (err instanceof multer.MulterError) {
      return next(httpError(400, MULTER_MESSAGES[err.code] ?? "Upload failed"));
    }
    next(err);
  });
}

export function removeFiles(files) {
  for (const file of files ?? []) fs.rm(file.path, { force: true }, () => {});
}
