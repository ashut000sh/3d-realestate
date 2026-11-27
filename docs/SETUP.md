# Setup: run Aawas on your laptop

Takes about 15 minutes the first time. Works on Windows, macOS and Linux.
Stuck? Look at **Problems** at the bottom, then ask in the team chat with the exact error.

## 1. Install the tools (once)

| Tool | Version | Get it |
|---|---|---|
| Node.js | 22 or newer | nodejs.org (LTS). Check: `node -v` |
| Git | any recent | git-scm.com. Check: `git --version` |
| PostgreSQL | 16 | postgresql.org. **Write down the password** you give the `postgres` user |
| VS Code | any | code.visualstudio.com, with the ESLint, Prettier and Tailwind CSS extensions |

## 2. Get the code

```bash
git clone https://github.com/ashut000sh/3d-realestate.git
cd 3d-realestate
npm install
```

`npm install` installs the website, the API and the shared code together (npm workspaces).

## 3. Settings files

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

(On Windows Command Prompt use `copy` instead of `cp`.)

Open `server/.env` and change two lines:

```
DATABASE_URL=postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/realestate
JWT_SECRET=any-long-random-text-only-you-know
```

Leave `SMTP_HOST` empty: the OTP code is then printed in the API terminal instead of emailed.
Never commit `.env` files (git already ignores them).

## 4. Database

```bash
createdb -U postgres realestate          # or create "realestate" in pgAdmin
npm run db:migrate -w server             # creates the tables (runs only new migrations)
npm run db:seed                          # sample data: EMPTIES every table first
```

The seed prints the test accounts. All of them use the password `Password123!`:

| Email | Role |
|---|---|
| admin@test.com | admin |
| ram.seller@test.com · sita.seller@test.com · hari.seller@test.com | seller |
| gita.buyer@test.com · bikash.buyer@test.com · anita.buyer@test.com | buyer |

Sample 3D tours (so the Tour screen works without a LiDAR scan):

```bash
npm run tours                            # writes client/public/tours/*.glb (incl. 2 multi-storey models)
```

## 5. Run it

```bash
npm run dev
```

- Website: http://localhost:5173
- API: http://localhost:4000 (check http://localhost:4000/api/health)

Only working on screens? `npm run dev:client` is enough, but API calls fail without the API.

## 6. Before every pull request

```bash
npm run lint
npm run format:check      # fix with: npm run format
npm run build
```

CI runs the same three on every pull request; a red check can't be merged.

## Every day

```bash
git checkout dev && git pull
npm install                     # in case someone added a package
npm run db:migrate -w server    # in case someone added a migration
git checkout -b feature/your-task
```

See `docs/GIT-WORKFLOW.md` for branches and pull requests.

## Problems

| You see | Fix |
|---|---|
| `DATABASE_URL is not set` | `server/.env` is missing: do step 3 |
| `password authentication failed for user "postgres"` | Wrong password in `DATABASE_URL` |
| `database "realestate" does not exist` | Run `createdb -U postgres realestate` (step 4) |
| `createdb: command not found` | Add PostgreSQL's `bin` folder to PATH, or create the database in pgAdmin |
| `relation "..." does not exist` | Run `npm run db:migrate -w server` |
| `Cannot find module 'multer'` (or any package) | Run `npm install` in the project folder |
| `EADDRINUSE: port 4000` | An old API is still running: close that terminal, or stop the `node` process |
| Every page says "Failed to fetch" | The API isn't running, or `client/.env` has the wrong `VITE_API_URL` |
| `Not implemented` from the API | That endpoint's branch isn't merged into your branch yet: `git merge dev` |
| No OTP email | Normal in development: the code is in the API terminal |
| `Too many wrong codes` on the OTP screen | Press "Resend" for a new code |
| 3D tour says it can't load | Run `npm run tours`, or check the tour file exists in `server/uploads/tours/` |
| Server won't start: `Set JWT_SECRET...` | You set `NODE_ENV=production`: give `JWT_SECRET` your own value |
