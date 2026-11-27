// Calendar dates as "YYYY-MM-DD" strings. Plain strings compare correctly ("2026-12-01" <
// "2026-12-15") and never shift by a day because of time zones. Maths is done in UTC.

const pad = (n) => String(n).padStart(2, "0");
const toIso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const parse = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

// Today in the user's own time zone (Nepal), plus `days`
export function localToday(days = 0) {
  const now = new Date();
  return toIso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days)));
}

export function addDays(iso, days) {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

// First day of the month `months` after the month of `iso`: ("2026-11-26", 1) -> "2026-12-01"
export function addMonths(iso, months) {
  const d = parse(iso);
  return toIso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1)));
}

export const startOfMonth = (iso) => `${iso.slice(0, 7)}-01`;

export function nightsBetween(from, to) {
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

// Grid for one month, weeks starting on Sunday (as on Nepali calendars).
// Returns an array of 7-day weeks; days outside the month are null.
export function monthGrid(monthStart) {
  const first = parse(monthStart);
  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const cells = Array(first.getUTCDay()).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(`${monthStart.slice(0, 8)}${pad(day)}`);
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// "2026-12-01" -> "December 2026"
export const monthLabel = (iso) =>
  parse(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

// "2026-12-20" -> "Sun, 20 Dec"   (withYear: "Sun, 20 Dec 2026")
export const shortDate = (iso, withYear = false) =>
  parse(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
