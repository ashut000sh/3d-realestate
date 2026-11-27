// "Stats" pop-up for one listing on My Listings: 30-day page-view chart, tour open rate,
// and the numbers for the last 30 days and all time.
// <StatsDialog stats={ListingStats} days={["2026-10-28", ...]} onClose={...} />
import { BOOKING_STATUS } from "@realestate/shared";
import Dialog from "../../components/Dialog.jsx";
import Icon from "../../components/Icon.jsx";

// "2026-11-26" -> "26 Nov"
const shortDate = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// Tour opens ÷ page views, as "42%" ("–" when there are no page views yet)
export function tourOpenRate(numbers) {
  if (!numbers.pageViews) return "–";
  return `${Math.round((numbers.tourOpens / numbers.pageViews) * 100)}%`;
}

export const totalBookings = (numbers) =>
  Object.values(numbers.bookings).reduce((sum, n) => sum + n, 0);

// Line + soft area for daily page views
function ViewsChart({ days, values }) {
  const W = 560;
  const H = 180;
  const PAD = { top: 12, right: 10, bottom: 26, left: 28 };
  const max = Math.max(1, ...values);
  const step = Math.max(1, Math.ceil(max / 4));
  const top = step * 4;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i) =>
    PAD.left + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
  const y = (v) => PAD.top + innerH - (v / top) * innerH;
  const line = values
    .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join("");
  const area = `${line}L${x(values.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const labelEvery = Math.ceil(values.length / 5);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`Page views per day, last ${values.length} days, ${values.reduce((a, b) => a + b, 0)} in total`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(step * i)}
            y2={y(step * i)}
            className="stroke-border"
            strokeDasharray={i === 0 ? "" : "3 4"}
          />
          <text
            x={PAD.left - 8}
            y={y(step * i) + 4}
            textAnchor="end"
            className="fill-muted text-[10px]"
          >
            {step * i}
          </text>
        </g>
      ))}
      <path d={area} className="fill-primary/10" />
      <path
        d={line}
        fill="none"
        className="stroke-primary"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {values.map((v, i) => (
        <g key={days[i]}>
          {v > 0 && (
            <circle
              cx={x(i)}
              cy={y(v)}
              r="3"
              className="fill-surface stroke-primary"
              strokeWidth="2"
            />
          )}
          {/* wide invisible hit area so the tooltip is easy to get */}
          <rect
            x={x(i) - innerW / values.length / 2}
            y={PAD.top}
            width={innerW / values.length}
            height={innerH}
            fill="transparent"
          >
            <title>{`${shortDate(days[i])}: ${v} ${v === 1 ? "view" : "views"}`}</title>
          </rect>
          {i % labelEvery === 0 && (
            <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted text-[10px]">
              {shortDate(days[i])}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

const ROWS = [
  { key: "pageViews", label: "Page views", icon: "eye" },
  { key: "tourOpens", label: "3D tour opens", icon: "cube" },
  { key: "saves", label: "Saves", icon: "heart" },
  { key: "chats", label: "Chats started", icon: "chat" },
];

const BOOKING_LABEL = {
  [BOOKING_STATUS.REQUESTED]: "Requested",
  [BOOKING_STATUS.CONFIRMED]: "Confirmed",
  [BOOKING_STATUS.DECLINED]: "Declined",
  [BOOKING_STATUS.CANCELLED]: "Cancelled",
};

export default function StatsDialog({ stats, days, windowDays, onClose }) {
  const recent = stats.last30Days;
  const all = stats.allTime;
  const totalRecentViews = stats.dailyPageViews.reduce((a, b) => a + b, 0);

  return (
    <Dialog title={`Stats · ${stats.title}`} onClose={onClose} wide>
      <div className="space-y-6">
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-semibold text-ink">Page views, last {windowDays} days</h3>
            <span className="text-sm text-muted">{totalRecentViews} total</span>
          </div>
          <div className="mt-3">
            {totalRecentViews === 0 ? (
              <p className="rounded-xl bg-sand/70 px-4 py-6 text-center text-sm text-muted">
                No page views in the last {windowDays} days yet.
              </p>
            ) : (
              <ViewsChart days={days} values={stats.dailyPageViews} />
            )}
          </div>
        </section>

        <section className="grain flex items-center gap-4 rounded-2xl bg-ink p-5 text-white">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-ink">
            <Icon name="cube" className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/70">Tour open rate, last {windowDays} days</p>
            <p className="text-xs text-white/50">
              {stats.hasTour
                ? "Share of page views that went on to open the 3D tour"
                : "This home has no 3D tour yet. Request a scan to get one."}
            </p>
          </div>
          <p className="display text-3xl text-accent">{tourOpenRate(recent)}</p>
        </section>

        <section>
          <h3 className="font-semibold text-ink">Numbers</h3>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-2 font-medium" />
                <th className="py-2 text-right font-medium">Last {windowDays} days</th>
                <th className="py-2 text-right font-medium">All time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ROWS.map((row) => (
                <tr key={row.key}>
                  <th scope="row" className="py-2.5 text-left font-normal text-text">
                    <span className="flex items-center gap-2">
                      <Icon name={row.icon} className="h-4 w-4 text-accent-dark" /> {row.label}
                    </span>
                  </th>
                  <td className="py-2.5 text-right font-semibold text-ink">{recent[row.key]}</td>
                  <td className="py-2.5 text-right font-semibold text-ink">{all[row.key]}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-2.5 text-left font-normal text-text">
                  <span className="flex items-center gap-2">
                    <Icon name="cube" className="h-4 w-4 text-accent-dark" /> Tour open rate
                  </span>
                </th>
                <td className="py-2.5 text-right font-semibold text-ink">{tourOpenRate(recent)}</td>
                <td className="py-2.5 text-right font-semibold text-ink">{tourOpenRate(all)}</td>
              </tr>
              {Object.entries(BOOKING_LABEL).map(([status, label]) => (
                <tr key={status}>
                  <th scope="row" className="py-2.5 text-left font-normal text-text">
                    <span className="flex items-center gap-2">
                      <Icon name="calendar" className="h-4 w-4 text-accent-dark" /> Bookings ·{" "}
                      {label.toLowerCase()}
                    </span>
                  </th>
                  <td className="py-2.5 text-right font-semibold text-ink">
                    {recent.bookings[status] ?? 0}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-ink">
                    {all.bookings[status] ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">
            A visitor counts once per hour. Your own visits aren't counted. Tour opens include
            people who opened the tour straight from a shared link, so the rate can pass 100%.
          </p>
        </section>
      </div>
    </Dialog>
  );
}
