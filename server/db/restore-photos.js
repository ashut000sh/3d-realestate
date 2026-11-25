// Puts the seed listings' photos back on disk without touching the database.
// Hosts like Render start every deploy (and every wake-up) with an empty disk, but the
// database keeps rows like /uploads/listings/5/1.jpg. This copies seed-assets/listings/<slug>/
// into uploads/listings/<id>/ for every listing whose title has seed photos.
// Usage: node db/restore-photos.js (run before the server starts; see render.yaml)
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const SEED_PHOTOS_DIR = path.resolve(import.meta.dirname, "seed-assets/listings");
const UPLOADED_LISTINGS_DIR = path.resolve(import.meta.dirname, "../uploads/listings");

const slugOf = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const { rows } = await client.query("SELECT id, title FROM listings");
await client.end();

let restored = 0;
for (const { id, title } of rows) {
  const from = path.join(SEED_PHOTOS_DIR, slugOf(title));
  if (!fs.existsSync(from)) continue;
  const to = path.join(UPLOADED_LISTINGS_DIR, String(id));
  fs.mkdirSync(to, { recursive: true });
  for (const file of fs.readdirSync(from)) {
    if (!fs.existsSync(path.join(to, file)))
      fs.copyFileSync(path.join(from, file), path.join(to, file));
  }
  restored++;
}
console.log(`seed photos on disk for ${restored} listings`);
