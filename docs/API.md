# API contract

This is the agreement between frontend and backend. **Backend sends exactly these shapes. Frontend expects exactly these shapes.**
If you need to change one, change this file first (in its own PR) and tell the other side.

- Base URL in development: `http://localhost:4000`
- Every URL below is also a constant in `shared/api-endpoints.js`. Use the constant, never the string.
- Logged-in requests send the header `Authorization: Bearer <token>` (`client/src/services/api.js` does this for you).
- Every error is `{ "error": "message" }` with a status code from `docs/CONVENTIONS.md`.
- Endpoints that aren't built yet answer `501 { "error": "Not implemented: ..." }`.

---

## Data shapes

These names are used in the tables below. All keys are camelCase. Dates are ISO strings (`"2026-11-01T10:00:00.000Z"`).

```js
User = {
  id: 7,
  fullName: "Sita Sharma",
  email: "sita@example.com",
  phone: "98XXXXXXXX",
  role: "buyer",                // ROLES
  isVerified: true,
  createdAt: "2026-10-11T05:00:00.000Z"
}

ListingSummary = {             // used in lists and search results (smaller, faster)
  id: 12,
  title: "3BHK house in Budhanilkantha",
  type: "sale",                 // LISTING_TYPE
  price: 32500000,
  district: "Kathmandu",
  coverImageUrl: "https://...",
  hasTour: true,
  lat: 27.7654, lng: 85.3651
}

Listing = {                     // full details on the Listing screen
  ...ListingSummary,
  description: "...",
  address: "Ward 6, Budhanilkantha",
  bedrooms: 3, bathrooms: 2, areaSqft: 2100,
  status: "live",               // LISTING_STATUS
  tourUrl: "https://.../tour.glb",   // null until a scan is published
  images: ["https://...", "https://..."],
  seller: { id: 4, fullName: "Ram Thapa" },
  createdAt: "...",
}

ScanRequest = {
  id: 3,
  listingId: 12,
  listingTitle: "3BHK house in Budhanilkantha",
  sellerId: 4,
  preferredDate: "2026-11-01",
  scheduledFor: null,           // set by admin
  notes: "Gate code 1234",
  status: "pending",            // SCAN_STATUS
  createdAt: "...",
}

Booking = {
  id: 9,
  listingId: 12,
  userId: 7,
  kind: "viewing",              // BOOKING_KIND
  date: "2026-11-05",
  checkOut: null,               // only for kind "stay"
  message: "Can I come after 4pm?",
  status: "requested",          // BOOKING_STATUS
  createdAt: "...",
  listing: { id, title, type, district, price, coverImageUrl },  // so screens never show bare ids
  userFullName,  // who booked (for the seller)
}

Conversation = {
  id: 2,
  listing: { id: 12, title: "..." },
  otherUser: { id: 4, fullName: "Ram Thapa" },
  lastMessage: { body: "See you then", createdAt: "..." },
  unreadCount: 1
}

Message = {
  id: 55,
  conversationId: 2,
  senderId: 7,
  body: "Is the price negotiable?",
  createdAt: "...",
}
```

---

## AUTH  ·  owner M4  ·  `server/src/modules/auth/`

| Constant | Method & path | Who can call | Request | Response |
|---|---|---|---|---|
| `API.AUTH.SIGNUP` | `POST /api/auth/signup` | public | `{ fullName, email, phone, password, role: "buyer" \| "seller" }` | `201 { userId, otpSentTo }` |
| `API.AUTH.VERIFY_OTP` | `POST /api/auth/verify-otp` | public | `{ userId, otp }` | `200 { token, user: User }` · wrong code `400` (says how many tries are left) · 5 wrong codes use the code up: `429`, ask for a new one |
| `API.AUTH.RESEND_OTP` | `POST /api/auth/resend-otp` | public | `{ userId }` | `200 { otpSentTo }` |
| `API.AUTH.LOGIN` | `POST /api/auth/login` | public | `{ email, password }` | `200 { token, user: User }` · `401` wrong email or password · `403 { error, userId }` email not verified |
| `API.AUTH.ME` | `GET /api/auth/me` | logged in | `-` | `200 { user: User }` |

## LISTINGS  ·  owner M4  ·  `server/src/modules/listings/`

| Constant | Method & path | Who can call | Request | Response |
|---|---|---|---|---|
| `API.LISTINGS.LIST` | `GET /api/listings` | public | `query: ?q, type, minPrice, maxPrice, district, page` | `200 { items: ListingSummary[], page, total }` |
| `API.LISTINGS.COMPARE` | `GET /api/listings/compare` | public | `query: ?ids=1,2,3 (max 3)` | `200 { items: Listing[] }` |
| `API.LISTINGS.MINE` | `GET /api/listings/mine` | seller | `-` | `200 { items: MyListing[] }` every status, newest first. `MyListing` = `ListingSummary` + `status`, `createdAt`, `imagesCount`, `scanStatus` (latest request or `null`), `pendingBookings`, `saves` |
| `API.LISTINGS.ONE` | `GET /api/listings/:id` | public | `-` | `200 { listing: Listing }` · listings that aren't `live` answer `404` except to their seller and admins (send the token if you have one) |
| `API.LISTINGS.CREATE` | `POST /api/listings` | seller | `{ title, description, type, price, district, address, lat, lng, bedrooms, bathrooms, areaSqft }` | `201 { listing: Listing }` |
| `API.LISTINGS.UPLOAD_IMAGES` | `POST /api/listings/:id/images` | owner seller | `multipart/form-data: images (1 to 10 .jpg/.png, max 5 MB each)` | `200 { images: string[] }` |
| `API.LISTINGS.UPDATE` | `PATCH /api/listings/:id` | owner seller | `any CREATE fields` | `200 { listing: Listing }` |

## SCANS  ·  owner M5  ·  `server/src/modules/scans/`

| Constant | Method & path | Who can call | Request | Response |
|---|---|---|---|---|
| `API.SCANS.CREATE` | `POST /api/scan-requests` | seller | `{ listingId, preferredDate, notes }` | `201 { scanRequest: ScanRequest }` |
| `API.SCANS.MINE` | `GET /api/scan-requests/mine` | seller | `-` | `200 { items: ScanRequest[] }` |
| `API.SCANS.UPDATE_STATUS` | `PATCH /api/scan-requests/:id/status` | admin | `{ status, scheduledFor? }` | `200 { scanRequest: ScanRequest }` |
| `API.SCANS.UPLOAD_TOUR` | `POST /api/scan-requests/:id/tour` | admin | `multipart/form-data: file (.glb)` | `200 { tourUrl }` |

## BOOKINGS  ·  owner M5  ·  `server/src/modules/bookings/`

| Constant | Method & path | Who can call | Request | Response |
|---|---|---|---|---|
| `API.BOOKINGS.CREATE` | `POST /api/bookings` | logged in | `{ listingId, kind: "viewing" \| "stay", date, checkOut?, message }` | `201 { booking: Booking }` |
| `API.BOOKINGS.MINE` | `GET /api/bookings/mine` | logged in | `query: ?as=seller (bookings on my listings instead of bookings I made)` | `200 { items: Booking[] }` |
| `API.BOOKINGS.UPDATE_STATUS` | `PATCH /api/bookings/:id/status` | listing owner | `{ status }` | `200 { booking: Booking }` |

## CHAT  ·  owner M5  ·  `server/src/modules/chat/`

| Constant | Method & path | Who can call | Request | Response |
|---|---|---|---|---|
| `API.CHAT.CONVERSATIONS` | `GET /api/chat/conversations` | logged in | `-` | `200 { items: Conversation[] }` |
| `API.CHAT.START` | `POST /api/chat/conversations` | logged in | `{ listingId }` | `201 { conversation: Conversation }` |
| `API.CHAT.MESSAGES` | `GET /api/chat/conversations/:id/messages` | participant | `query: ?before (for older pages)` | `200 { items: Message[] }` |

## ADMIN  ·  owner M5  ·  `server/src/modules/admin/`

| Constant | Method & path | Who can call | Request | Response |
|---|---|---|---|---|
| `API.ADMIN.STATS` | `GET /api/admin/stats` | admin | `-` | `200 { listings, users, pendingScans, bookingsThisWeek }` |
| `API.ADMIN.SCAN_QUEUE` | `GET /api/admin/scan-requests` | admin | `query: ?status` | `200 { items: ScanRequest[] }` · each item also has `sellerFullName` (for the dashboard's seller column) |
| `API.ADMIN.USERS` | `GET /api/admin/users` | admin | `query: ?role` | `200 { items: User[] }` |

---


## SAVED  ·  `server/src/modules/saved/`

| Constant | Method + URL | Who | Send | Get back |
|---|---|---|---|---|
| `API.SAVED.LIST` | `GET /api/saved` | logged in | `-` | `200 { items: ListingSummary[] }` newest saved first, live listings only |
| `API.SAVED.IDS` | `GET /api/saved/ids` | logged in | `-` | `200 { ids: number[] }` (to fill the hearts) |
| `API.SAVED.ADD` | `POST /api/saved` | logged in | `{ listingId }` | `201 { listingId }` · live listings only (else `404`) · saving twice is fine |
| `API.SAVED.REMOVE` | `DELETE /api/saved/:listingId` | logged in | `-` | `200 { listingId }` |

## Live chat (Socket.IO)

Connect to the same server URL. Event names are in `shared/socket-events.js`.

| Constant | Direction | Payload |
|---|---|---|
| `SOCKET_EVENTS.JOIN_CONVERSATION` | client → server | `{ conversationId }` |
| `SOCKET_EVENTS.SEND_MESSAGE` | client → server | `{ conversationId, body }` |
| `SOCKET_EVENTS.NEW_MESSAGE` | server → client | `Message` |
| `SOCKET_EVENTS.TYPING` | both | `{ conversationId, userId }` |
| `SOCKET_EVENTS.ERROR` | server → client | `{ error }` |

---

## Changelog

Add a line whenever this contract changes, so the other side knows to update.

| Date | Who | Change |
|---|---|---|
| 2026-10-11 | M1 | First version |
| 2026-11-22 | M1 | Added `API.LISTINGS.UPLOAD_IMAGES` (listing photos) and `?as=seller` on `API.BOOKINGS.MINE`; documented the login 401/403 errors |
