// CHAT controllers: read the request, call the service, send the response.
// No SQL in here. Database work belongs in chat.service.js.
import { httpError } from "../../middleware/errorHandler.js";
import * as chatService from "./chat.service.js";

// GET /api/chat/conversations   (logged in)
// in:  -
// out: 200 { items: Conversation[] }
export async function conversations(req, res) {
  res.json(await chatService.listConversations(req.user.id));
}

// POST /api/chat/conversations   (logged in)
// in:  { listingId }
// out: 201 { conversation: Conversation }
// Returns the existing conversation if this buyer already chatted about this listing.
export async function start(req, res) {
  const listingId = readId(req.body?.listingId, "listingId");
  res.status(201).json(await chatService.startConversation(req.user.id, listingId));
}

// GET /api/chat/conversations/:id/messages   (participant)
// in:  query: ?before (for older pages)
// out: 200 { items: Message[] }
// 30 per page, oldest first inside the page. For older messages send ?before=<id of the oldest one you have>.
export async function messages(req, res) {
  const id = readId(req.params.id, "id");
  const before = req.query.before;
  const beforeId = before === undefined || before === "" ? null : readId(before, "before");
  res.json(await chatService.listMessages(id, req.user.id, beforeId));
}

function readId(value, name) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, `${name} must be a positive number`);
  return id;
}
