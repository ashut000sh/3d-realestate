// Frontend side of the ADMIN module. Shapes: docs/API.md -> ADMIN.
import { API, buildPath } from "@realestate/shared";
import { request } from "./api.js";

export const getStats = () => request("GET", API.ADMIN.STATS);
export const getScanQueue = (status) =>
  request("GET", API.ADMIN.SCAN_QUEUE, { query: { status } }).then((d) => d.items);
export const getUsers = (role) =>
  request("GET", API.ADMIN.USERS, { query: { role } }).then((d) => d.items);

// Scan queue actions (these endpoints live in the SCANS module, built by M5).
export const updateScanStatus = (id, status, scheduledFor) =>
  request("PATCH", buildPath(API.SCANS.UPDATE_STATUS, { id }), {
    body: { status, scheduledFor },
  }).then((d) => d.scanRequest);

export const uploadTour = (id, file) => {
  const form = new FormData();
  form.append("file", file);
  return request("POST", buildPath(API.SCANS.UPLOAD_TOUR, { id }), { body: form }).then(
    (d) => d.tourUrl,
  );
};

export const getInsights = () => request("GET", API.ADMIN.INSIGHTS);
export const getAllBookings = (status) =>
  request("GET", API.ADMIN.BOOKINGS, { query: { status } }).then((d) => d.items);

// "Verified seller" badge: { userId, sellerVerified, sellerVerifiedAt }
export const verifySeller = (id) => request("PATCH", buildPath(API.ADMIN.VERIFY_SELLER, { id }));
export const unverifySeller = (id) =>
  request("PATCH", buildPath(API.ADMIN.UNVERIFY_SELLER, { id }));
