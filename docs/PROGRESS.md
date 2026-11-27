# Progress log

One short entry per week, newest at the top. Owner: M3 (Nirmal Yadav).
Each entry: what got **done**, what is **next**, and **blockers**. Link pull requests (#number)
where you can. Meeting details are in `docs/meetings/`.

Phases (from the team work plan): 0 Setup (week 1) · 1 Foundations (2 to 4) · 2 Build (5 to 8) ·
3 Connect (9 to 11) · 4 Finish (12 to 14).

---

## Week 1 · Phase 0 Setup · week of 24 Nov 2026

**Done**

- GitHub repository `3d-realestate` set up with `main` and `dev`, one `feature/...` branch and
  one issue per task, and branch protection (Ashutosh Karki).
- Auth API (signup, OTP, login, me) and JWT middleware written: pull request #33 into `dev`.
- Backend written on feature branches, waiting for review: listings API and listing photo upload
  (Ashutosh Karki); seed data, scan requests and 3D tour upload, bookings, chat with live socket,
  admin API (Purshottam Yadav's part).
- Frontend screens written on feature branches, waiting for review: Home, Search with map,
  Listing, Compare, Booking, Seller scan request (Nirmal Yadav's part).
- New migration `002_message_read_at.sql` for chat unread counts.

**Next**

- Review and merge #33, then the other branches in order (see each pull request).
- Install new packages when merging: `multer` (server), `leaflet` and `react-leaflet` (client).
- Team lead to confirm the 3D tour size limit (50 MB used for now) and the extra fields
  `sellerFullName` (admin scan queue) and booking titles for the seller panel.

**Blockers**

- #33 needs one approval before anything else can be merged.
