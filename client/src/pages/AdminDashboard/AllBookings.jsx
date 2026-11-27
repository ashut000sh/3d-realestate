// Every booking on the platform, for the admin dashboard (GET /api/admin/bookings). Owner: M1.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BOOKING_KIND, BOOKING_STATUS } from "@realestate/shared";
import Badge from "../../components/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { Skeleton } from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { getAllBookings } from "../../services/admin.service.js";

const TABS = [
  { key: "", label: "All" },
  { key: BOOKING_STATUS.REQUESTED, label: "Waiting" },
  { key: BOOKING_STATUS.CONFIRMED, label: "Confirmed" },
  { key: BOOKING_STATUS.DECLINED, label: "Declined" },
  { key: BOOKING_STATUS.CANCELLED, label: "Cancelled" },
];

const STATUS_TONE = {
  [BOOKING_STATUS.REQUESTED]: "warning",
  [BOOKING_STATUS.CONFIRMED]: "success",
  [BOOKING_STATUS.DECLINED]: "danger",
  [BOOKING_STATUS.CANCELLED]: "neutral",
};

const day = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export default function AllBookings() {
  const [tab, setTab] = useState("");
  const [state, setState] = useState({ tab: null, items: null, error: "" });

  useEffect(() => {
    let cancelled = false;
    getAllBookings(tab || undefined)
      .then((items) => !cancelled && setState({ tab, items, error: "" }))
      .catch((err) => !cancelled && setState({ tab, items: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const fresh = state.tab === tab;

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex flex-wrap gap-1 border-b border-border px-4 pt-3">
        {TABS.map((t) => (
          <button
            key={t.key || "all"}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 pb-3 text-sm font-semibold transition ${
              tab === t.key
                ? "border-primary text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {fresh && state.error ? (
        <div className="p-5">
          <EmptyState
            icon="alert"
            tone="danger"
            title="Couldn't load bookings"
            text={state.error}
          />
        </div>
      ) : !fresh ? (
        <div className="space-y-2 p-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : state.items.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">No bookings here.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-sand/50 text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Home</th>
                <th className="px-5 py-3 font-semibold">Guest</th>
                <th className="px-5 py-3 font-semibold">Seller</th>
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {state.items.map((b) => (
                <tr key={b.id} className="hover:bg-sand/30">
                  <td className="max-w-64 px-5 py-3">
                    <Link
                      to={buildRoute(ROUTES.LISTING, { id: b.listingId })}
                      className="block truncate font-medium text-ink hover:text-primary"
                    >
                      {b.listing.title}
                    </Link>
                    <span className="text-xs text-muted">{b.listing.district}</span>
                  </td>
                  <td className="px-5 py-3 text-ink">{b.userFullName}</td>
                  <td className="px-5 py-3 text-muted">{b.sellerFullName}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-muted">
                    {b.kind === BOOKING_KIND.STAY
                      ? `Stay ${day(b.date)} → ${day(b.checkOut)}`
                      : `Viewing ${day(b.date)}`}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[b.status]} dot className="capitalize">
                      {b.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
