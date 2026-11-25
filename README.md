# Aawas — 3D Property Tours for Nepal

Final Year Project · Presidential Graduate School · Team of 5

A real-estate marketplace where buyers and renters walk through properties as 3D LiDAR tours.
Sellers request a scan, our team captures it, and the listing goes live with an interactive tour.

---

## Run it on your machine

You need **Node.js 22+**, **Git**, and (for backend work) **PostgreSQL 16+**.

```bash
git clone <repo-url>
cd 3d-realestate
npm install                         # installs client, server and shared in one go
cp client/.env.example client/.env
cp server/.env.example server/.env  # then put your own DATABASE_URL in it
npm run db:migrate -w server        # backend people only: creates the tables
npm run dev                         # API on :4000, website on :5173
```

Frontend only? `npm run dev:client` is enough. API calls will return "Not implemented" until the backend is built.

---

## Where everything lives

```
3d-realestate/
├── shared/                     ← values BOTH sides use. Read this first.
│   ├── constants.js              roles, statuses, limits
│   ├── api-endpoints.js          every backend URL
│   └── socket-events.js          chat event names
│
├── client/src/                 ← FRONTEND (React + Tailwind)
│   ├── pages/                    ONE FOLDER PER SCREEN
│   │   ├── Splash/  Onboarding/  Signup/  Login/  Otp/
│   │   ├── Home/  Search/  Listing/  Tour/  Compare/  Booking/
│   │   └── Chat/  ScanRequest/  AdminDashboard/  NotFound/
│   ├── components/               shared UI: Button, Input, Loader, Navbar
│   ├── layouts/                  MainLayout (navbar + page)
│   ├── services/                 the ONLY place that calls the backend
│   ├── constants/routes.js       every frontend URL
│   ├── styles/index.css          the ONLY global CSS file + colour tokens
│   └── App.jsx                   connects URLs to screens
│
├── server/src/                 ← BACKEND (Express + PostgreSQL)
│   ├── modules/                  ONE FOLDER PER FEATURE
│   │   ├── auth/  listings/  scans/  bookings/  chat/  admin/
│   │   │   each has  .routes.js  .controller.js  .service.js
│   ├── middleware/               auth checks, error handling
│   ├── config/                   env variables, database connection
│   └── app.js                    connects modules to the app
│
├── server/db/migrations/       ← database tables (SQL)
└── docs/                       ← how we work. Read before your first PR.
```

---

## Something broke? Where to look

| What's broken | Frontend | Backend |
|---|---|---|
| Login | `client/src/pages/Login/` · `services/auth.service.js` | `server/src/modules/auth/` |
| OTP | `client/src/pages/Otp/` · `services/auth.service.js` | `server/src/modules/auth/` |
| Sign up | `client/src/pages/Signup/` | `server/src/modules/auth/` |
| Loading screen | `client/src/pages/Splash/` · `components/Loader.jsx` | — |
| Search / listings | `pages/Search/` · `pages/Listing/` · `services/listings.service.js` | `server/src/modules/listings/` |
| 3D tour | `client/src/pages/Tour/` | `server/src/modules/scans/` (upload) |
| Bookings | `client/src/pages/Booking/` | `server/src/modules/bookings/` |
| Chat | `client/src/pages/Chat/` · `services/chat.service.js` | `server/src/modules/chat/` |
| Admin | `client/src/pages/AdminDashboard/` | `server/src/modules/admin/` |
| Styling on **every** page | `client/src/styles/index.css` | — |
| Styling on **one** page | that page's folder | — |
| Every API call fails | `client/src/services/api.js` · `client/.env` | `server/src/app.js` · `server/.env` |
| Page shows the wrong screen / 404 | `client/src/constants/routes.js` · `App.jsx` | — |

Each file also starts with a comment saying who owns it. Ask that person first.

---

## Read these next

1. **[docs/TEAM.md](docs/TEAM.md)** — who owns which screens and modules
2. **[docs/GIT-WORKFLOW.md](docs/GIT-WORKFLOW.md)** — branches, pull requests, daily commands
3. **[docs/CONVENTIONS.md](docs/CONVENTIONS.md)** — naming rules and where code goes
4. **[docs/API.md](docs/API.md)** — every endpoint: what you send, what you get back
5. **docs/TEAM-WORK-PLAN.docx** — the full plan: every person's tasks, step by step
