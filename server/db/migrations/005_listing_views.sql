-- Listing views: one row each time a listing page or its 3D tour is opened (seller stats).
-- At most one row per viewer (or anonymous session_key) per listing per kind per hour;
-- the API enforces that (server/src/modules/stats/stats.service.js). The owner isn't counted.
-- viewer_id becomes NULL if the user is deleted, so their past views still count.
CREATE TABLE listing_views (
  id           BIGSERIAL PRIMARY KEY,
  listing_id   INT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewer_id    INT REFERENCES users(id) ON DELETE SET NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('page', 'tour')),
  session_key  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX listing_views_listing_kind_created_idx
  ON listing_views (listing_id, kind, created_at);
