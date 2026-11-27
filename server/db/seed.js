// Fills the database with sample data for testing. Usage: npm run db:seed -w server
// WARNING: it first EMPTIES every table, so never run it against real data.
// Run the migrations first: npm run db:migrate -w server
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import pg from "pg";
import {
  BOOKING_KIND,
  BOOKING_STATUS,
  DISTRICTS,
  LISTING_STATUS,
  LISTING_TYPE,
  ROLES,
  SCAN_STATUS,
} from "@realestate/shared";

const PASSWORD = "Password123!";

// ---------- the sample data ----------

const USERS = [
  { key: "admin", fullName: "Admin Team", email: "admin@test.com", role: ROLES.ADMIN },
  { key: "ram", fullName: "Ram Thapa", email: "ram.seller@test.com", role: ROLES.SELLER },
  { key: "sita", fullName: "Sita Shrestha", email: "sita.seller@test.com", role: ROLES.SELLER },
  { key: "hari", fullName: "Hari Gurung", email: "hari.seller@test.com", role: ROLES.SELLER },
  { key: "gita", fullName: "Gita Rai", email: "gita.buyer@test.com", role: ROLES.BUYER },
  { key: "bikash", fullName: "Bikash Tamang", email: "bikash.buyer@test.com", role: ROLES.BUYER },
  { key: "anita", fullName: "Anita Magar", email: "anita.buyer@test.com", role: ROLES.BUYER },
];

// Rough centre of each district, so map markers land in the right place
const DISTRICT_CENTRE = {
  Kathmandu: [27.7172, 85.324],
  Lalitpur: [27.6644, 85.3188],
  Bhaktapur: [27.671, 85.4298],
  Kaski: [28.2096, 83.9856],
  Chitwan: [27.5291, 84.3542],
};

// Sample 3D tours. Every live listing gets one, matched to its kind of property.
// The .glb files are made by `npm run tours` into client/public/tours/ (git-ignored).
const TOUR_BY_KIND = {
  house: "/tours/house.glb",
  apartment: "/tours/apartment.glb",
  room: "/tours/room.glb",
  office: "/tours/office.glb",
  // Multi-storey, for the tour's "Floors" view (npm run tours makes them):
  twoStorey: "/tours/house-two-storey.glb", // levels named Level_1 / Level_2
  townhouse: "/tours/townhouse.glb", // 3 storeys, unnamed: levels are auto-detected
};
// Listing title -> kind of tour
const TOUR_KIND = {
  "3BHK house in Budhanilkantha": "twoStorey",
  "2BHK flat in Baluwatar": "apartment",
  "Thamel studio for travellers": "room",
  "Bungalow in Bhaisepati": "house",
  "Office floor in Pulchowk": "office",
  "Newari house in Patan": "townhouse",
  "Heritage homestay near Durbar Square": "room",
  "Family flat in Suryabinayak": "apartment",
  "Land with small house in Thimi": "house",
  "Apartment in Sanepa Heights": "apartment",
  "Lakeside room with Phewa view": "room",
  "Hotel building in Pokhara": "room",
  "Cottage near Sarangkot": "house",
  "Jungle lodge in Sauraha": "room",
  "Farm house in Bharatpur": "house",
};

// scan: the status of this listing's scan request (null = no request yet).
// The listing's own status follows from it (see listingStatusFor below).
const { SALE, RENT, SHORT_STAY } = LISTING_TYPE;
const { PENDING, SCHEDULED, SCANNED, PUBLISHED, CANCELLED } = SCAN_STATUS;
const LISTINGS = [
  {
    seller: "ram",
    type: SALE,
    district: "Kathmandu",
    title: "3BHK house in Budhanilkantha",
    address: "Ward 6, Budhanilkantha",
    price: 32500000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqft: 2100,
    floors: 3, // levels (a flat or a single room counts as 1)
    scan: PUBLISHED,
  },
  {
    seller: "ram",
    type: RENT,
    district: "Kathmandu",
    title: "2BHK flat in Baluwatar",
    address: "Baluwatar, near Bhatbhateni",
    price: 35000,
    bedrooms: 2,
    bathrooms: 1,
    areaSqft: 950,
    floors: 1,
    scan: PUBLISHED,
  },
  {
    seller: "ram",
    type: SHORT_STAY,
    district: "Kathmandu",
    title: "Thamel studio for travellers",
    address: "Thamel Marg",
    price: 3500,
    bedrooms: 1,
    bathrooms: 1,
    areaSqft: 400,
    floors: 1,
    scan: null,
  },
  {
    seller: "ram",
    type: SALE,
    district: "Lalitpur",
    title: "Bungalow in Bhaisepati",
    address: "Bhaisepati Awas",
    price: 58000000,
    bedrooms: 5,
    bathrooms: 4,
    areaSqft: 3800,
    floors: 2,
    scan: PENDING,
  },
  {
    seller: "ram",
    type: RENT,
    district: "Lalitpur",
    title: "Office floor in Pulchowk",
    address: "Pulchowk, opposite Labim Mall",
    price: 120000,
    bedrooms: 0,
    bathrooms: 2,
    areaSqft: 2500,
    floors: 1,
    scan: null,
  },
  {
    seller: "sita",
    type: SALE,
    district: "Lalitpur",
    title: "Newari house in Patan",
    address: "Mangal Bazar, Patan",
    price: 27500000,
    bedrooms: 4,
    bathrooms: 2,
    areaSqft: 1800,
    floors: 4,
    scan: PUBLISHED,
  },
  {
    seller: "sita",
    type: SHORT_STAY,
    district: "Bhaktapur",
    title: "Heritage homestay near Durbar Square",
    address: "Taumadhi, Bhaktapur",
    price: 4500,
    bedrooms: 2,
    bathrooms: 1,
    areaSqft: 900,
    floors: 3,
    scan: PUBLISHED,
  },
  {
    seller: "sita",
    type: RENT,
    district: "Bhaktapur",
    title: "Family flat in Suryabinayak",
    address: "Suryabinayak-4",
    price: 22000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqft: 1200,
    floors: 1,
    scan: SCHEDULED,
  },
  {
    seller: "sita",
    type: SALE,
    district: "Bhaktapur",
    title: "Land with small house in Thimi",
    address: "Madhyapur Thimi",
    price: 16000000,
    bedrooms: 2,
    bathrooms: 1,
    areaSqft: 1100,
    floors: 1,
    scan: null,
  },
  {
    seller: "sita",
    type: SALE,
    district: "Kathmandu",
    title: "Apartment in Sanepa Heights",
    address: "Sanepa, Lalitpur border",
    price: 21000000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqft: 1350,
    floors: 1,
    scan: CANCELLED,
  },
  {
    seller: "hari",
    type: SHORT_STAY,
    district: "Kaski",
    title: "Lakeside room with Phewa view",
    address: "Lakeside-6, Pokhara",
    price: 5000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqft: 450,
    floors: 1,
    scan: PUBLISHED,
  },
  {
    seller: "hari",
    type: SALE,
    district: "Kaski",
    title: "Hotel building in Pokhara",
    address: "Baidam, Pokhara",
    price: 95000000,
    bedrooms: 12,
    bathrooms: 12,
    areaSqft: 9000,
    floors: 6,
    scan: SCANNED,
  },
  {
    seller: "hari",
    type: RENT,
    district: "Kaski",
    title: "Cottage near Sarangkot",
    address: "Sarangkot road",
    price: 28000,
    bedrooms: 2,
    bathrooms: 1,
    areaSqft: 800,
    floors: 2,
    scan: null,
  },
  {
    seller: "hari",
    type: SHORT_STAY,
    district: "Chitwan",
    title: "Jungle lodge in Sauraha",
    address: "Sauraha, Chitwan",
    price: 6000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqft: 500,
    floors: 1,
    scan: PENDING,
  },
  {
    seller: "hari",
    type: SALE,
    district: "Chitwan",
    title: "Farm house in Bharatpur",
    address: "Bharatpur-10",
    price: 18500000,
    bedrooms: 4,
    bathrooms: 3,
    areaSqft: 2600,
    floors: 2,
    scan: null,
  },
];

// Bookings: listing index (0-based in LISTINGS), who booked, what.
const BOOKINGS = [
  {
    listing: 0,
    user: "gita",
    kind: BOOKING_KIND.VIEWING,
    inDays: 3,
    status: BOOKING_STATUS.REQUESTED,
    message: "Can I come on Saturday morning?",
  },
  {
    listing: 1,
    user: "bikash",
    kind: BOOKING_KIND.VIEWING,
    inDays: 5,
    status: BOOKING_STATUS.CONFIRMED,
    message: "Is parking included?",
  },
  {
    listing: 5,
    user: "anita",
    kind: BOOKING_KIND.VIEWING,
    inDays: 2,
    status: BOOKING_STATUS.DECLINED,
    message: null,
  },
  {
    listing: 6,
    user: "gita",
    kind: BOOKING_KIND.STAY,
    inDays: 10,
    nights: 2,
    status: BOOKING_STATUS.REQUESTED,
    message: "Two adults, arriving by bus.",
  },
  {
    listing: 10,
    user: "bikash",
    kind: BOOKING_KIND.STAY,
    inDays: 14,
    nights: 3,
    status: BOOKING_STATUS.CONFIRMED,
    message: null,
  },
  {
    listing: 10,
    user: "anita",
    kind: BOOKING_KIND.STAY,
    inDays: 20,
    nights: 1,
    status: BOOKING_STATUS.CANCELLED,
    message: "Sorry, plans changed.",
  },
];

// Chats: listing index, buyer, then messages alternating buyer / seller.
const CHATS = [
  {
    listing: 0,
    buyer: "gita",
    messages: [
      "Hello, is the price negotiable?",
      "A little. Come and see it first.",
      "Great, I booked a viewing.",
    ],
  },
  {
    listing: 10,
    buyer: "bikash",
    messages: ["Does the room have hot water?", "Yes, solar and electric."],
  },
  {
    listing: 5,
    buyer: "anita",
    messages: ["How old is the house?", "Around 60 years, renovated in 2022.", "Thanks!"],
  },
];

// ---------- helpers ----------

function listingStatusFor(scan) {
  if (scan === PUBLISHED) return LISTING_STATUS.LIVE;
  if (scan === PENDING || scan === SCHEDULED || scan === SCANNED) {
    return LISTING_STATUS.AWAITING_SCAN;
  }
  if (scan === CANCELLED) return LISTING_STATUS.DRAFT;
  // No scan request: some are live without a tour so search has plenty to show
  return LISTING_STATUS.LIVE;
}

// Date `days` from today as "YYYY-MM-DD"
function dateIn(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Small fixed offset so listings in one district don't sit on the same point
function nearby([lat, lng], i) {
  return [lat + ((i % 5) - 2) * 0.008, lng + ((i % 3) - 1) * 0.01];
}

// Photos are stored in the project (server/db/seed-assets/listings/<slug>/1.jpg, 2.jpg, 3.jpg,
// 1 = cover; credits in seed-photos.js) and copied to where uploaded photos live,
// server/uploads/listings/<listing id>/, so the demo works offline.
const SEED_PHOTOS_DIR = path.resolve(import.meta.dirname, "seed-assets/listings");
const UPLOADED_LISTINGS_DIR = path.resolve(import.meta.dirname, "../uploads/listings");
const PHOTO_FILES = ["1.jpg", "2.jpg", "3.jpg"];

const slugOf = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Copies the listing's photos and returns their URLs, in order (the first is the cover)
function copyPhotos(listing, listingId) {
  const from = path.join(SEED_PHOTOS_DIR, slugOf(listing.title));
  const to = path.join(UPLOADED_LISTINGS_DIR, String(listingId));
  fs.mkdirSync(to, { recursive: true });
  return PHOTO_FILES.map((file) => {
    const source = path.join(from, file);
    if (!fs.existsSync(source)) throw new Error(`Missing seed photo ${source}`);
    fs.copyFileSync(source, path.join(to, file));
    return `/uploads/listings/${listingId}/${file}`;
  });
}

// ---------- seeding ----------

async function seed(client) {
  // Empty everything and restart ids at 1
  await client.query(
    `TRUNCATE messages, conversations, bookings, scan_requests, listing_images, listings,
              otp_codes, users RESTART IDENTITY CASCADE`,
  );

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const userId = {};
  for (const user of USERS) {
    const { rows } = await client.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, is_verified)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
      [
        user.fullName,
        user.email,
        "98" + String(10000000 + USERS.indexOf(user)),
        passwordHash,
        user.role,
      ],
    );
    userId[user.key] = rows[0].id;
  }

  // Start with no listing photos on disk, so old test uploads don't pile up.
  // Only listings/: uploaded 3D tours in uploads/tours/ are left alone.
  fs.rmSync(UPLOADED_LISTINGS_DIR, { recursive: true, force: true });

  const listingIds = [];
  const districtCount = {};
  for (const [i, listing] of LISTINGS.entries()) {
    if (!DISTRICTS.includes(listing.district))
      throw new Error(`Unknown district ${listing.district}`);
    districtCount[listing.district] = (districtCount[listing.district] ?? 0) + 1;
    const [lat, lng] = nearby(DISTRICT_CENTRE[listing.district], districtCount[listing.district]);

    const { rows } = await client.query(
      `INSERT INTO listings (seller_id, title, description, type, status, price, district, address,
                             lat, lng, bedrooms, bathrooms, area_sqft, floors, tour_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
               now() - make_interval(days => $16))
       RETURNING id`,
      [
        userId[listing.seller],
        listing.title,
        `${listing.title}. Sample listing for testing. ${listing.bedrooms} bedrooms, ${listing.areaSqft} sq ft.`,
        listing.type,
        listingStatusFor(listing.scan),
        listing.price,
        listing.district,
        listing.address,
        lat,
        lng,
        listing.bedrooms,
        listing.bathrooms,
        listing.areaSqft,
        listing.floors,
        listingStatusFor(listing.scan) === LISTING_STATUS.LIVE
          ? TOUR_BY_KIND[TOUR_KIND[listing.title]]
          : null,
        LISTINGS.length - i, // older listings first, so the newest is listing 15
      ],
    );
    const listingId = rows[0].id;
    listingIds.push(listingId);

    for (const [position, url] of copyPhotos(listing, listingId).entries()) {
      await client.query(
        "INSERT INTO listing_images (listing_id, url, position) VALUES ($1, $2, $3)",
        [listingId, url, position],
      );
    }

    if (listing.scan) {
      await client.query(
        `INSERT INTO scan_requests (listing_id, seller_id, preferred_date, scheduled_for, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          listingId,
          userId[listing.seller],
          dateIn(7 + i),
          listing.scan === PENDING || listing.scan === CANCELLED
            ? null
            : `${dateIn(5 + i)}T10:00:00+05:45`,
          "Call 30 minutes before arriving.",
          listing.scan,
        ],
      );
    }
  }

  for (const booking of BOOKINGS) {
    await client.query(
      `INSERT INTO bookings (listing_id, user_id, kind, date, check_out, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        listingIds[booking.listing],
        userId[booking.user],
        booking.kind,
        dateIn(booking.inDays),
        booking.kind === BOOKING_KIND.STAY ? dateIn(booking.inDays + booking.nights) : null,
        booking.message,
        booking.status,
      ],
    );
  }

  for (const chat of CHATS) {
    const sellerId = userId[LISTINGS[chat.listing].seller];
    const buyerId = userId[chat.buyer];
    const { rows } = await client.query(
      `INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES ($1, $2, $3) RETURNING id`,
      [listingIds[chat.listing], buyerId, sellerId],
    );
    for (const [i, body] of chat.messages.entries()) {
      await client.query(
        `INSERT INTO messages (conversation_id, sender_id, body, created_at)
         VALUES ($1, $2, $3, now() - make_interval(mins => $4))`,
        [rows[0].id, i % 2 === 0 ? buyerId : sellerId, body, (chat.messages.length - i) * 10],
      );
    }
  }
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  await seed(client);
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  console.error("Seeding failed, nothing was changed:", err.message);
  process.exitCode = 1;
}
await client.end();

if (!process.exitCode) {
  console.log(
    `\nSeeded ${USERS.length} users, ${LISTINGS.length} listings, ${BOOKINGS.length} bookings, ${CHATS.length} chats.`,
  );
  console.log(`Test accounts (password for all: ${PASSWORD})`);
  console.table(USERS.map(({ email, role, fullName }) => ({ email, role, name: fullName })));
}
