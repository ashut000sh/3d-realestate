// CHAT service: all database queries for this module live here.
// Used by the REST controllers AND by chat.socket.js (live messages).
import { LISTING_STATUS } from "@realestate/shared";
import { query } from "../../config/db.js";
import { httpError } from "../../middleware/errorHandler.js";

export const MESSAGES_PER_PAGE = 30;
export const MAX_MESSAGE_LENGTH = 2000;

// One Conversation (docs/API.md) as seen by user $1. "c" = conversations.
// otherUser is the seller if I'm the buyer, and the buyer if I'm the seller.
const CONVERSATION_SELECT = `
  SELECT c.id,
         l.id AS listing_id, l.title AS listing_title,
         other.id AS other_id, other.full_name AS other_full_name,
         last.body AS last_body, last.created_at AS last_created_at,
         (SELECT count(*)::int FROM messages m
           WHERE m.conversation_id = c.id AND m.sender_id <> $1 AND m.read_at IS NULL) AS unread_count
    FROM conversations c
    JOIN listings l ON l.id = c.listing_id
    JOIN users other ON other.id = CASE WHEN c.buyer_id = $1 THEN c.seller_id ELSE c.buyer_id END
    LEFT JOIN LATERAL (
      SELECT body, created_at FROM messages m
       WHERE m.conversation_id = c.id
       ORDER BY m.created_at DESC, m.id DESC LIMIT 1
    ) last ON true`;

function toConversation(row) {
  return {
    id: row.id,
    listing: { id: row.listing_id, title: row.listing_title },
    otherUser: { id: row.other_id, fullName: row.other_full_name },
    lastMessage:
      row.last_body === null ? null : { body: row.last_body, createdAt: row.last_created_at },
    unreadCount: row.unread_count,
  };
}

function toMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

// All my conversations, the one with the newest message first
export async function listConversations(userId) {
  const { rows } = await query(
    `${CONVERSATION_SELECT}
      WHERE c.buyer_id = $1 OR c.seller_id = $1
      ORDER BY COALESCE(last.created_at, c.created_at) DESC, c.id DESC`,
    [userId],
  );
  return { items: rows.map(toConversation) };
}

async function getConversation(conversationId, userId) {
  const { rows } = await query(`${CONVERSATION_SELECT} WHERE c.id = $2`, [userId, conversationId]);
  return toConversation(rows[0]);
}

// A buyer opens a chat about a listing. Finds the existing conversation
// (one per listing per buyer) or creates it.
export async function startConversation(userId, listingId) {
  const { rows } = await query("SELECT seller_id, status FROM listings WHERE id = $1", [listingId]);
  const listing = rows[0];
  if (!listing || listing.status !== LISTING_STATUS.LIVE) throw httpError(404, "Listing not found");
  if (listing.seller_id === userId)
    throw httpError(400, "You can't chat with yourself about your own listing");

  // ON CONFLICT: if two requests arrive at once, the UNIQUE (listing_id, buyer_id) rule keeps one
  await query(
    `INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES ($1, $2, $3)
     ON CONFLICT (listing_id, buyer_id) DO NOTHING`,
    [listingId, userId, listing.seller_id],
  );
  const found = await query(
    "SELECT id FROM conversations WHERE listing_id = $1 AND buyer_id = $2",
    [listingId, userId],
  );
  return { conversation: await getConversation(found.rows[0].id, userId) };
}

// 404 if the conversation doesn't exist, 403 if this user isn't in it
export async function assertParticipant(conversationId, userId) {
  const { rows } = await query("SELECT buyer_id, seller_id FROM conversations WHERE id = $1", [
    conversationId,
  ]);
  if (rows.length === 0) throw httpError(404, "Conversation not found");
  if (rows[0].buyer_id !== userId && rows[0].seller_id !== userId) {
    throw httpError(403, "You are not part of this conversation");
  }
}

// One page of messages, oldest first inside the page (ready to show top to bottom).
// Without beforeId: the newest MESSAGES_PER_PAGE. With beforeId: the ones just older than it.
// Next older page: pass the id of the first (oldest) message you already have.
export async function listMessages(conversationId, userId, beforeId) {
  await assertParticipant(conversationId, userId);
  const { rows } = await query(
    `SELECT id, conversation_id, sender_id, body, created_at FROM messages
      WHERE conversation_id = $1 AND ($2::int IS NULL OR id < $2)
      ORDER BY id DESC
      LIMIT $3`,
    [conversationId, beforeId, MESSAGES_PER_PAGE],
  );
  // Opening the newest page means the user has seen the chat
  if (!beforeId) await markRead(conversationId, userId);
  return { items: rows.reverse().map(toMessage) };
}

// Everything the OTHER person sent in this conversation is now read
export async function markRead(conversationId, userId) {
  await query(
    `UPDATE messages SET read_at = now()
      WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL`,
    [conversationId, userId],
  );
}

// Saves a message (used by the socket) and returns it as a Message
export async function saveMessage(conversationId, senderId, body) {
  await assertParticipant(conversationId, senderId);
  const { rows } = await query(
    `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)
     RETURNING id, conversation_id, sender_id, body, created_at`,
    [conversationId, senderId, body],
  );
  return toMessage(rows[0]);
}
