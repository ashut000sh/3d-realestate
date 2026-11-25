// Charts for the admin dashboard (GET /api/admin/insights). Owner: M1.
// Plain SVG and CSS bars in the brand colours: no chart library to install.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BOOKING_STATUS, SCAN_STATUS } from "@realestate/shared";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import { Skeleton } from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { getInsights } from "../../services/admin.service.js";
import { LISTING_TYPE_LABEL, formatPrice } from "../../utils/formatPrice.js";

const SERIES = [
  { key: "listings", label: "New listings", bar: "fill-primary", dot: "bg-primary" },
  { key: "bookings", label: "Bookings", bar: "fill-accent", dot: "bg-accent" },
  { key: "signups", label: "Sign-ups", bar: "fill-info", dot: "bg-info" },
];

const TYPE_COLOURS = ["bg-primary", "bg-accent", "bg-info"];

const SCAN_LABEL = {
  [SCAN_STATUS.PENDING]: "Requested",
  [SCAN_STATUS.SCHEDULED]: "Visit booked",
  [SCAN_STATUS.SCANNED]: "Scanned",
  [SCAN_STATUS.PUBLISHED]: "Tour live",
  [SCAN_STATUS.CANCELLED]: "Cancelled",
};

const BOOKING_META = {
  [BOOKING_STATUS.REQUESTED]: { label: "Waiting", bar: "bg-warning" },
  [BOOKING_STATUS.CONFIRMED]: { label: "Confirmed", bar: "bg-success" },
  [BOOKING_STATUS.DECLINED]: { label: "Declined", bar: "bg-danger" },
  [BOOKING_STATUS.CANCELLED]: { label: "Cancelled", bar: "bg-border" },
};

// "2026-11-23" -> "23 Nov"
const shortDate = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      <h3 className="font-semibold text-ink">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

// Grouped bars: one group per week, one bar per series
function WeeklyChart({ weeks }) {
  const W = 640;
  const H = 220;
  const PAD = { top: 12, right: 8, bottom: 28, left: 28 };
  const max = Math.max(1, ...weeks.flatMap((w) => SERIES.map((s) => w[s.key])));
  const step = Math.max(1, Math.ceil(max / 4));
  const top = step * 4;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const groupW = innerW / weeks.length;
  const barW = Math.min(14, (groupW - 10) / SERIES.length);
  const y = (v) => PAD.top + innerH - (v / top) * innerH;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Weekly activity">
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
        {weeks.map((week, wi) => {
          const groupX = PAD.left + wi * groupW + (groupW - barW * SERIES.length) / 2;
          return (
            <g key={week.weekStart}>
              {SERIES.map((s, si) => {
                const value = week[s.key];
                const h = Math.max(value > 0 ? 3 : 0, (value / top) * innerH);
                return (
                  <rect
                    key={s.key}
                    x={groupX + si * barW}
                    y={PAD.top + innerH - h}
                    width={barW - 2}
                    height={h}
                    rx="3"
                    className={`${s.bar} transition-opacity hover:opacity-80`}
                  >
                    <title>{`${s.label}, week of ${shortDate(week.weekStart)}: ${value}`}</title>
                  </rect>
                );
              })}
              <text
                x={PAD.left + wi * groupW + groupW / 2}
                y={H - 8}
                textAnchor="middle"
                className="fill-muted text-[10px]"
              >
                {shortDate(week.weekStart)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-sm ${s.dot}`} /> {s.label}{" "}
            <span className="font-semibold text-ink">
              {weeks.reduce((sum, w) => sum + w[s.key], 0)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function DistrictBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.district}>
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-medium text-ink">{r.district}</span>
            <span className="text-muted">
              <span className="font-semibold text-ink">{r.live}</span> live · {r.total} total
            </span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-sand">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary/25"
              style={{ width: `${(r.total / max) * 100}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
              style={{ width: `${(r.live / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TypeMix({ rows }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return (
    <div className="space-y-5">
      <div className="flex h-3 overflow-hidden rounded-full bg-sand">
        {rows.map((r, i) => (
          <div
            key={r.type}
            className={TYPE_COLOURS[i % TYPE_COLOURS.length]}
            style={{ width: total ? `${(r.count / total) * 100}%` : 0 }}
            title={`${LISTING_TYPE_LABEL[r.type]}: ${r.count}`}
          />
        ))}
      </div>
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li key={r.type} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-sm ${TYPE_COLOURS[i % TYPE_COLOURS.length]}`} />
              <span className="font-medium text-ink">{LISTING_TYPE_LABEL[r.type]}</span>
              <span className="text-muted">
                {r.count} · {total ? Math.round((r.count / total) * 100) : 0}%
              </span>
            </span>
            <span className="text-right text-muted">
              avg{" "}
              <span className="font-semibold text-ink">
                {r.avgPrice ? formatPrice(r.avgPrice, r.type) : "–"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// The scan pipeline as steps. Each step's bar is relative to the biggest step.
function ScanFunnel({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.status} className="flex items-center gap-3">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              r.status === SCAN_STATUS.CANCELLED
                ? "bg-sand text-muted"
                : "bg-accent-soft text-accent-dark"
            }`}
          >
            {r.status === SCAN_STATUS.CANCELLED ? <Icon name="x" className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-ink">{SCAN_LABEL[r.status] ?? r.status}</span>
              <span className="font-semibold text-ink">{r.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sand">
              <div
                className={`h-full rounded-full ${r.status === SCAN_STATUS.CANCELLED ? "bg-border" : "bg-accent"}`}
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function BookingSplit({ rows }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const ordered = Object.keys(BOOKING_META).map(
    (status) => rows.find((r) => r.status === status) ?? { status, count: 0 },
  );
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        <span className="display text-3xl text-ink">{total}</span> bookings in total
      </p>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-sand">
        {ordered.map((r) =>
          r.count ? (
            <div
              key={r.status}
              className={BOOKING_META[r.status].bar}
              style={{ width: `${(r.count / total) * 100}%` }}
              title={`${BOOKING_META[r.status].label}: ${r.count}`}
            />
          ) : null,
        )}
      </div>
      <ul className="grid grid-cols-2 gap-3 text-sm">
        {ordered.map((r) => (
          <li key={r.status} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-sm ${BOOKING_META[r.status].bar}`} />
            <span className="text-muted">{BOOKING_META[r.status].label}</span>
            <span className="ml-auto font-semibold text-ink">{r.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopListings({ rows }) {
  if (rows.length === 0) return <p className="text-sm text-muted">No live listings yet.</p>;
  return (
    <ol className="divide-y divide-border">
      {rows.map((r, i) => (
        <li key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span className="display w-6 text-xl text-accent-dark">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <Link
              to={buildRoute(ROUTES.LISTING, { id: r.id })}
              className="block truncate font-medium text-ink hover:text-primary"
            >
              {r.title}
            </Link>
            <p className="text-xs text-muted">
              {LISTING_TYPE_LABEL[r.type]} · {r.district}
            </p>
          </div>
          <div className="flex gap-3 text-xs text-muted">
            <span className="flex items-center gap-1" title="Saved">
              <Icon name="heart" className="h-3.5 w-3.5" /> {r.saves}
            </span>
            <span className="flex items-center gap-1" title="Bookings">
              <Icon name="calendar" className="h-3.5 w-3.5" /> {r.bookings}
            </span>
            <span className="flex items-center gap-1" title="Chats">
              <Icon name="chat" className="h-3.5 w-3.5" /> {r.chats}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Insights({ version }) {
  const [state, setState] = useState({ version: null, data: null, error: "" });

  useEffect(() => {
    let cancelled = false;
    getInsights()
      .then((data) => !cancelled && setState({ version, data, error: "" }))
      .catch((err) => !cancelled && setState({ version, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [version]);

  // Keep showing the old charts while new numbers load (no flicker)
  const { data, error } = state;
  if (error) {
    return <EmptyState icon="alert" tone="danger" title="Couldn't load insights" text={error} />;
  }
  if (!data) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const chips = [
    { icon: "cube", label: "Listings with a 3D tour", value: data.totals.withTour },
    { icon: "heart", label: "Homes saved", value: data.totals.saves },
    { icon: "chat", label: "Messages this week", value: data.totals.messagesThisWeek },
    { icon: "mail", label: "Unverified accounts", value: data.totals.unverifiedUsers },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <span
            key={c.label}
            className="flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-sm ring-1 ring-border"
          >
            <Icon name={c.icon} className="h-4 w-4 text-accent-dark" />
            <span className="text-muted">{c.label}</span>
            <span className="font-semibold text-ink">{c.value}</span>
          </span>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Activity" subtitle="Last 8 weeks" className="lg:col-span-2">
          <WeeklyChart weeks={data.weekly} />
        </Panel>
        <Panel title="Scan pipeline" subtitle="Every scan request by stage">
          <ScanFunnel rows={data.scanFunnel} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Listings by district" subtitle="Live and total">
          <DistrictBars rows={data.listingsByDistrict} />
        </Panel>
        <Panel title="Listing mix" subtitle="By type, with average live price">
          <TypeMix rows={data.listingsByType} />
        </Panel>
        <Panel title="Bookings" subtitle="By status">
          <BookingSplit rows={data.bookingsByStatus} />
        </Panel>
      </div>

      <Panel
        title="Most wanted homes"
        subtitle="Live listings with the most saves, bookings and chats"
      >
        <TopListings rows={data.topListings} />
      </Panel>
    </div>
  );
}
