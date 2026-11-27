-- Number of floors (levels) of a listing, for the area card on the Listing page.
-- Existing listings become 1 floor; sellers can change it in "Edit details".
-- The limits match FLOORS in shared/constants.js.
ALTER TABLE listings
  ADD COLUMN floors INT NOT NULL DEFAULT 1 CHECK (floors BETWEEN 1 AND 10);
