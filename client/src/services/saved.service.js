import { API, buildPath } from "@realestate/shared";
import { request } from "./api.js";

export const getSaved = () => request("GET", API.SAVED.LIST).then((d) => d.items);
export const getSavedIds = () => request("GET", API.SAVED.IDS).then((d) => d.ids);
export const saveListing = (listingId) =>
  request("POST", API.SAVED.ADD, { body: { listingId } }).then((d) => d.listingId);
export const unsaveListing = (listingId) =>
  request("DELETE", buildPath(API.SAVED.REMOVE, { listingId })).then((d) => d.listingId);
