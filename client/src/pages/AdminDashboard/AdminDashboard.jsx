// Screen:    AdminDashboard
// URL:       ROUTES.ADMIN  ("/admin")
// Owner:     M1  (see docs/TEAM.md)
// Wireframe: 12 Admin Dashboard
// Job:       Stats, scan-request queue, upload finished 3D tours. Admin only.
//            (App.jsx wraps this page in <RequireAuth role="admin">.)
import { useEffect, useState } from "react";
import { ROLES, SCAN_STATUS } from "@realestate/shared";
import Avatar from "../../components/Avatar.jsx";
import Badge from "../../components/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import { Skeleton } from "../../components/Loader.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { getScanQueue, getStats, getUsers } from "../../services/admin.service.js";
import AllBookings from "./AllBookings.jsx";
import Insights from "./Insights.jsx";
import ScanQueue, { STATUS_META } from "./ScanQueue.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const STAT_CARDS = [
  { key: "listings", label: "Listings", icon: "home", tone: "bg-primary-soft text-primary" },
  { key: "users", label: "Users", icon: "users", tone: "bg-info-soft text-info" },
  {
    key: "pendingScans",
    label: "Scans waiting",
    icon: "scan",
    tone: "bg-warning-soft text-warning",
  },
  {
    key: "bookingsThisWeek",
    label: "Bookings this week",
    icon: "calendar",
    tone: "bg-success-soft text-success",
  },
];

const QUEUE_TABS = [
  SCAN_STATUS.PENDING,
  SCAN_STATUS.SCHEDULED,
  SCAN_STATUS.SCANNED,
  SCAN_STATUS.PUBLISHED,
  SCAN_STATUS.CANCELLED,
];
const ROLE_TABS = ["", ROLES.BUYER, ROLES.SELLER, ROLES.ADMIN];
const ROLE_TONE = { buyer: "info", seller: "gold", admin: "dark" };

// Loads data for a key (e.g. the chosen tab). `loading` is worked out from the key,
// so nothing is set inside the effect itself.
function useKeyedLoad(key, load) {
  const [state, setState] = useState({ key: null, data: null, error: "" });
  useEffect(() => {
    let cancelled = false;
    load(key)
      .then((data) => !cancelled && setState({ key, data, error: "" }))
      .catch((err) => !cancelled && setState({ key, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
    // load is a module-level function per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const fresh = state.key === key;
  return {
    data: fresh ? state.data : null,
    error: fresh ? state.error : "",
    loading: !fresh,
    setData: (updater) => setState((s) => ({ ...s, data: updater(s.data) })),
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [queueTab, setQueueTab] = useState(SCAN_STATUS.PENDING);
  const [roleTab, setRoleTab] = useState("");
  const [statsVersion, setStatsVersion] = useState(0);

  const stats = useKeyedLoad(statsVersion, () => getStats());
  const queue = useKeyedLoad(queueTab, (status) => getScanQueue(status));
  const users = useKeyedLoad(roleTab, (role) => getUsers(role || undefined));

  // A request changed status: drop it from this tab if it no longer belongs, refresh numbers
  function handleChanged(updated) {
    queue.setData((list) =>
      (list ?? [])
        .map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
        .filter((r) => r.status === queueTab),
    );
    setStatsVersion((v) => v + 1);
  }

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  usePageTitle("Admin dashboard");

  return (
    <main className="page space-y-10">
      {/* Header */}
      <section className="grain relative overflow-hidden rounded-[28px] bg-ink px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-primary/60 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-accent">Admin dashboard</p>
            <h1 className="display mt-2 text-3xl sm:text-4xl">
              {greeting}, {user?.fullName.split(" ")[0]}
            </h1>
            <p className="mt-2 text-white/70">
              Schedule scan visits, publish 3D tours and keep an eye on the marketplace.
            </p>
          </div>
          <Badge tone="gold" className="text-sm">
            <Icon name="shield" className="h-4 w-4" /> Admin
          </Badge>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="card card-hover">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
              <Icon name={card.icon} className="h-5 w-5" />
            </span>
            {stats.data ? (
              <p className="display mt-4 text-4xl text-ink tabular-nums">{stats.data[card.key]}</p>
            ) : (
              <Skeleton className="mt-4 h-10 w-16" />
            )}
            <p className="mt-1 text-sm text-muted">{card.label}</p>
          </div>
        ))}
      </section>
      {stats.error && (
        <p className="text-sm text-danger">Couldn't load the numbers: {stats.error}</p>
      )}

      {/* Insights: charts and trends */}
      <section className="space-y-5">
        <div>
          <h2 className="display text-2xl text-ink">Insights</h2>
          <p className="text-sm text-muted">How the marketplace is growing and where homes are.</p>
        </div>
        <Insights version={statsVersion} />
      </section>

      {/* Scan queue */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="display text-2xl text-ink">Scan queue</h2>
            <p className="text-sm text-muted">Sellers asking our team to scan their homes.</p>
          </div>
          <div
            className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1"
            role="tablist"
          >
            {QUEUE_TABS.map((status) => (
              <button
                key={status}
                role="tab"
                aria-selected={queueTab === status}
                onClick={() => setQueueTab(status)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                  queueTab === status
                    ? "bg-ink text-white"
                    : "text-muted hover:bg-sand hover:text-ink"
                }`}
              >
                {STATUS_META[status].label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5">
          {queue.loading ? (
            <div className="space-y-3">
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
            </div>
          ) : queue.error ? (
            <EmptyState
              icon="alert"
              tone="danger"
              title="Couldn't load the queue"
              text={queue.error}
            />
          ) : queue.data.length === 0 ? (
            <EmptyState
              icon="check"
              title={`No ${STATUS_META[queueTab].label.toLowerCase()} requests`}
              text="Nothing to do here right now."
            />
          ) : (
            <ScanQueue requests={queue.data} onChanged={handleChanged} />
          )}
        </div>
      </section>

      {/* Bookings across the platform */}
      <section className="space-y-5">
        <div>
          <h2 className="display text-2xl text-ink">Bookings</h2>
          <p className="text-sm text-muted">
            Every viewing and stay, with the guest and the seller.
          </p>
        </div>
        <AllBookings />
      </section>

      {/* Users */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="display text-2xl text-ink">People</h2>
            <p className="text-sm text-muted">Everyone with an Aawas account.</p>
          </div>
          <div className="flex gap-1 rounded-xl border border-border bg-surface p-1" role="tablist">
            {ROLE_TABS.map((role) => (
              <button
                key={role || "all"}
                role="tab"
                aria-selected={roleTab === role}
                onClick={() => setRoleTab(role)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
                  roleTab === role ? "bg-ink text-white" : "text-muted hover:bg-sand hover:text-ink"
                }`}
              >
                {role ? `${role}s` : "All"}
              </button>
            ))}
          </div>
        </div>
        <div className="card mt-5 overflow-hidden p-0">
          {users.loading ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : users.error ? (
            <p className="p-5 text-sm text-danger">{users.error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-sand/60 text-xs tracking-wide text-muted uppercase">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Phone</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.data.map((person) => (
                    <tr key={person.id} className="transition hover:bg-sand/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={person.fullName} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-ink">{person.fullName}</p>
                            <p className="text-xs text-muted">{person.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={ROLE_TONE[person.role]} className="capitalize">
                          {person.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted">{person.phone ?? "–"}</td>
                      <td className="px-5 py-3">
                        {person.isVerified ? (
                          <Badge tone="success" dot>
                            Verified
                          </Badge>
                        ) : (
                          <Badge tone="warning" dot>
                            Unverified
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {new Date(person.createdAt).toLocaleDateString("en-GB", {
                          dateStyle: "medium",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
