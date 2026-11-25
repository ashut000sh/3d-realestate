-- Chat: remember when the receiver read each message, so conversations can show unreadCount.
-- NULL = not read yet. Messages you sent yourself are never "unread" for you.
ALTER TABLE messages ADD COLUMN read_at TIMESTAMPTZ;

-- Fast lookup of the conversations a user is in
CREATE INDEX idx_conversations_buyer ON conversations (buyer_id);
CREATE INDEX idx_conversations_seller ON conversations (seller_id);
