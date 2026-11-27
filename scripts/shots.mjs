// Full-page screenshots of every page, for design reviews: npm run shots
//
//   npm run shots                      every page, 1440x900 and 390x844
//   npm run shots -- home search       only these pages
//   npm run shots -- --reset           first rebuild the demo data (npm run demo:reset: WIPES local data)
//
// Saves .shots/<YYYY-MM-DD>/<page>-<width>.png (git-ignored). Starts the app (npm run dev) if
// it isn't running, and stops it again afterwards. Logs in as buyer / seller / admin through
// the API, so no form typing. Uses the installed Microsoft Edge (no browser download).
// Screens are taken with reduced motion, so animations are captured at their final state.
/* global console, process, setTimeout, fetch, URL, document, localStorage, sessionStorage -- Node script; the last three are used inside page.evaluate (browser) */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = process.env.SHOTS_WEB_URL ?? "http://localhost:5173";
const API = process.env.SHOTS_API_URL ?? "http://localhost:4000";
const SIZES = [
  { width: 1440, height: 900 },
  { width: 390, height: 844, mobile: true },
];
const ACCOUNTS = {
  buyer: "anita.buyer@test.com",
  seller: "sita.seller@test.com",
  admin: "admin@test.com",
};
const PASSWORD = "Password123!";

// name, path, who is logged in, text that tells us the page has loaded, optional setup
const PAGES = [
  { name: "splash", path: "/", ready: "Aawas" },
  { name: "onboarding", path: "/welcome", ready: "" },
  { name: "home", path: "/home", ready: "Homes worth" },
  { name: "search", path: "/search", ready: "homes" },
  { name: "search-filtered", path: "/search?district=Kathmandu&minArea=900", ready: "homes" },
  { name: "listing", path: "/listings/1", ready: "Where it is" },
  { name: "tour", path: "/listings/1/tour", ready: "Floors" },
  { name: "compare", path: "/compare", ready: "Compare", local: { compareIds: "[1,6,15]" } },
  { name: "booking", path: "/listings/11/book", as: "buyer", ready: "Your dates" },
  { name: "chat", path: "/chat", as: "buyer", ready: "Messages" },
  { name: "saved", path: "/saved", as: "buyer", ready: "Saved" },
  { name: "my-bookings", path: "/bookings", as: "buyer", ready: "bookings" },
  { name: "my-listings", path: "/sell/listings", as: "seller", ready: "30 days" },
  { name: "seller-studio", path: "/sell/scan-request", as: "seller", ready: "Floors" },
  { name: "admin", path: "/admin", as: "admin", ready: "Seller check" },
  { name: "login", path: "/login", ready: "Log in" },
  { name: "signup", path: "/signup", ready: "account" },
  {
    name: "otp",
    path: "/verify",
    ready: "code",
    session: {
      "aawas:pendingVerification": JSON.stringify({ userId: 1, otpSentTo: "you@example.com" }),
    },
  },
  { name: "not-found", path: "/this-page-does-not-exist", ready: "" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up = async (url) => {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
};

async function ensureApp() {
  if ((await up(`${API}/api/health`)) && (await up(WEB))) return null;
  console.log("Starting the app (npm run dev)...");
  const app = spawn("npm", ["run", "dev"], { cwd: ROOT, shell: true, stdio: "ignore" });
  for (let i = 0; i < 90; i++) {
    if ((await up(`${API}/api/health`)) && (await up(WEB))) return app;
    await sleep(1000);
  }
  throw new Error("The app didn't start in 90 s");
}

async function login(email) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const data = await res.json();
  if (!data.token) throw new Error(`Login failed for ${email}: ${data.error}. Try --reset.`);
  return data.token;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--reset")) {
    spawnSync("npm", ["run", "demo:reset"], { cwd: ROOT, shell: true, stdio: "inherit" });
  }
  const only = args.filter((a) => !a.startsWith("--"));
  const pages = only.length ? PAGES.filter((p) => only.includes(p.name)) : PAGES;

  const app = await ensureApp();
  const tokens = {};
  for (const [role, email] of Object.entries(ACCOUNTS)) tokens[role] = await login(email);

  const day = new Date().toISOString().slice(0, 10);
  const outDir = path.join(ROOT, ".shots", day);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ channel: "msedge" });
  const problems = [];
  try {
    for (const size of SIZES) {
      for (const page of pages) {
        const context = await browser.newContext({
          viewport: { width: size.width, height: size.height },
          deviceScaleFactor: 1,
          isMobile: Boolean(size.mobile),
          hasTouch: Boolean(size.mobile),
          reducedMotion: "reduce",
        });
        const token = page.as ? tokens[page.as] : null;
        await context.addInitScript(
          ({ token, local, session }) => {
            if (token) localStorage.setItem("token", token);
            else localStorage.removeItem("token");
            for (const [k, v] of Object.entries(local ?? {})) localStorage.setItem(k, v);
            for (const [k, v] of Object.entries(session ?? {})) sessionStorage.setItem(k, v);
          },
          { token, local: page.local, session: page.session },
        );
        const tab = await context.newPage();
        const errors = [];
        tab.on("pageerror", (e) => errors.push(e.message));
        tab.on("console", (m) => m.type() === "error" && errors.push(m.text()));
        await tab.goto(new URL(page.path, WEB).href, { waitUntil: "domcontentloaded" });
        if (page.ready) {
          await tab
            .waitForFunction(
              (text) => document.body.innerText.toLowerCase().includes(text.toLowerCase()),
              page.ready,
              { timeout: 20000 },
            )
            .catch(() => problems.push(`${page.name}@${size.width}: never showed "${page.ready}"`));
        }
        // Let images and map tiles arrive (the network never goes fully quiet on the tour)
        await tab.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
        await sleep(page.name === "tour" ? 2500 : 800);
        const file = path.join(outDir, `${page.name}-${size.width}.png`);
        await tab.screenshot({ path: file, fullPage: page.name !== "tour" });
        const overflow = await tab.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        if (overflow > 0)
          problems.push(`${page.name}@${size.width}: page scrolls sideways by ${overflow}px`);
        for (const e of errors)
          problems.push(`${page.name}@${size.width}: console error: ${e.slice(0, 160)}`);
        console.log(`saved ${path.relative(ROOT, file)}`);
        await context.close();
      }
    }
  } finally {
    await browser.close();
    if (app) {
      // npm run dev starts two node processes: stop the whole group
      if (process.platform === "win32")
        spawnSync("taskkill", ["/pid", String(app.pid), "/T", "/F"]);
      else app.kill("SIGTERM");
    }
  }
  console.log(problems.length ? `\nProblems:\n- ${problems.join("\n- ")}` : "\nNo problems found.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
