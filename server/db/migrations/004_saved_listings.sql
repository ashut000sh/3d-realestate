-- Saved homes: a user's shortlist of listings (the heart button).
-- One row per user per listing. Removed with the user or the listing.
CREATE TABLE saved_listings (
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id  INT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);
