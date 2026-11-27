// Frontend side of the LISTINGS module. Shapes: docs/API.md -> LISTINGS.
import { API, buildPath } from "@realestate/shared";
import { request } from "./api.js";

export const searchListings = (filters) => request("GET", API.LISTINGS.LIST, { query: filters });
export const getListing = (id) =>
  request("GET", buildPath(API.LISTINGS.ONE, { id })).then((d) => d.listing);
export const compareListings = (ids) =>
  request("GET", API.LISTINGS.COMPARE, { query: { ids: ids.join(",") } }).then((d) => d.items);
export const createListing = (form) =>
  request("POST", API.LISTINGS.CREATE, { body: form }).then((d) => d.listing);

export const uploadListingImages = (id, files) => {
  const form = new FormData();
  [...files].forEach((file) => form.append("images", file));
  return request("POST", buildPath(API.LISTINGS.UPLOAD_IMAGES, { id }), { body: form }).then(
    (d) => d.images,
  );
};
export const getMyListings = () => request("GET", API.LISTINGS.MINE).then((d) => d.items);
export const updateListing = (id, fields) =>
  request("PATCH", buildPath(API.LISTINGS.UPDATE, { id }), { body: fields }).then((d) => d.listing);
// { items: [{ category, name, lat, lng, distanceMeters }], message } — never fails on Overpass outages
export const getNearbyPlaces = (id) => request("GET", buildPath(API.LISTINGS.NEARBY, { id }));
// Walking route to a place: { distanceMeters, durationMinutes, coordinates: [[lat, lng]], approximate }
export const getWalkingRoute = (id, { lat, lng }) =>
  request("GET", buildPath(API.LISTINGS.WALKING_ROUTE, { id }), { query: { lat, lng } });
