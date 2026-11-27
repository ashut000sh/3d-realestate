// SAVED controllers: read the request, call the service, send the response.
import { httpError } from "../../middleware/errorHandler.js";
import * as savedService from "./saved.service.js";

// GET /api/saved   (logged in)
// out: 200 { items: ListingSummary[] }   newest saved first, live listings only
export async function list(req, res) {
  res.json(await savedService.listSaved(req.user.id));
}

// GET /api/saved/ids   (logged in)
// out: 200 { ids: number[] }   so cards can show a filled heart without loading every listing
export async function ids(req, res) {
  res.json(await savedService.savedIds(req.user.id));
}

// POST /api/saved   (logged in)
// in:  { listingId }
// out: 201 { listingId }   saving twice is fine (still 201)
export async function add(req, res) {
  const listingId = readId(req.body?.listingId, "listingId");
  res.status(201).json(await savedService.saveListing(req.user.id, listingId));
}

// DELETE /api/saved/:listingId   (logged in)
// out: 200 { listingId }   removing something not saved is fine too
export async function remove(req, res) {
  const listingId = readId(req.params.listingId, "listingId");
  res.json(await savedService.unsaveListing(req.user.id, listingId));
}

function readId(value, name) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, `${name} must be a positive number`);
  return id;
}
