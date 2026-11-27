-- "Verified seller" badge: an admin checked the seller's documents (lalpurja / citizenship) in person.
-- Set by PATCH /api/admin/users/:id/verify-seller, cleared by .../unverify-seller.
-- seller_verified_by = the admin who did it (kept as NULL if that admin account is deleted).
ALTER TABLE users
  ADD COLUMN seller_verified_at TIMESTAMPTZ,
  ADD COLUMN seller_verified_by INT REFERENCES users(id) ON DELETE SET NULL;
