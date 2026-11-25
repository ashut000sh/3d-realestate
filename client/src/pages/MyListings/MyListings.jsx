// Screen:    MyListings
// URL:       ROUTES.MY_LISTINGS  ("/sell/listings")
// Job:       A seller's own listings in every status: edit details, add photos,
//            request a 3D scan, and see saves and waiting bookings. Sellers only.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LISTING_STATUS, SCAN_STATUS } from "@realestate/shared";
import Badge from "../../components/Badge.jsx";
import Button from "../../components/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import { Skeleton } from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { getListing, getMyListings, uploadListingImages } from "../../services/listings.service.js";
import { LISTING_TYPE_LABEL, formatPrice } from "../../utils/formatPrice.js";
import { mediaUrl } from "../../utils/mediaUrl.js";
import EditListingDialog from "./EditListingDialog.jsx";
import RequestScanDialog from "./RequestScanDialog.jsx";

const STATUS_META = {
  [LISTING_STATUS.LIVE]: { label: "Live", tone: "success" },
  [LISTING_STATUS.AWAITING_SCAN]: { label: "Waiting for scan", tone: "warning" },
  [LISTING_STATUS.DRAFT]: { label: "Draft", tone: "neutral" },
  [LISTING_STATUS.ARCHIVED]: { label: "Archived", tone: "neutral" },
};

const SCAN_TEXT = {
  [SCAN_STATUS.PENDING]: "Scan requested, our team will call you",
  [SCAN_STATUS.SCHEDULED]: "Scan visit booked",
  [SCAN_STATUS.SCANNED]: "Scanned, 3D tour being prepared",
  [SCAN_STATUS.PUBLISHED]: "3D tour published",
  [SCAN_STATUS.CANCELLED]: "Last scan request was cancelled",
};

const OPEN_SCAN = [SCAN_STATUS.PENDING, SCAN_STATUS.SCHEDULED, SCAN_STATUS.SCANNED];
const MAX_PHOTOS = 10;
const MAX_PHOTO_MB = 5;

const FILTERS = [
  { key: "all", label: "All" },
  { key: LISTING_STATUS.LIVE, label: "Live" },
  { key: LISTING_STATUS.AWAITING_SCAN, label: "Waiting for scan" },
  { key: LISTING_STATUS.DRAFT, label: "Drafts" },
];

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-border">
      <Icon name={icon} className="h-5 w-5 text-accent-dark" />
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function ListingRow({ item, onEdit, onScan, onPhotos, busy }) {
  const fileInput = useRef(null);
  const meta = STATUS_META[item.status] ?? { label: item.status, tone: "neutral" };
  const cover = mediaUrl(item.coverImageUrl);
  const canRequestScan = !item.hasTour && !OPEN_SCAN.includes(item.scanStatus);
  const listingUrl = buildRoute(ROUTES.LISTING, { id: item.id });

  return (
    <li className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
      <Link
        to={listingUrl}
        className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-sand lg:w-44"
      >
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-1 text-xs text-muted">
            <Icon name="image" className="h-6 w-6" /> No photos
          </span>
        )}
        {item.hasTour && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-ink/85 px-2 py-0.5 text-[11px] font-semibold text-white">
            <Icon name="cube" className="h-3 w-3 text-accent" /> 3D
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
          <span className="text-xs font-medium tracking-wide text-muted uppercase">
            {LISTING_TYPE_LABEL[item.type]} · {item.district}
          </span>
        </div>
        <Link
          to={listingUrl}
          className="block truncate text-lg font-semibold text-ink hover:text-primary"
        >
          {item.title}
        </Link>
        <p className="font-semibold text-primary">{formatPrice(item.price, item.type)}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Icon name="image" className="h-4 w-4" /> {item.imagesCount} photos
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="heart" className="h-4 w-4" /> {item.saves} saved
          </span>
          {item.pendingBookings > 0 && (
            <Link
              to={ROUTES.SCAN_REQUEST}
              className="flex items-center gap-1.5 font-semibold text-warning hover:underline"
            >
              <Icon name="calendar" className="h-4 w-4" /> {item.pendingBookings} booking
              {item.pendingBookings === 1 ? "" : "s"} to answer
            </Link>
          )}
          {item.scanStatus && (
            <span className="flex items-center gap-1.5">
              <Icon name="scan" className="h-4 w-4" /> {SCAN_TEXT[item.scanStatus]}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 lg:w-56 lg:flex-col">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(item)}
          loading={busy === "edit"}
        >
          <Icon name="key" className="h-4 w-4" /> Edit details
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInput.current?.click()}
          loading={busy === "photos"}
          disabled={item.imagesCount >= MAX_PHOTOS}
        >
          <Icon name="camera" className="h-4 w-4" /> Add photos
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          multiple
          hidden
          onChange={(event) => {
            onPhotos(item, [...event.target.files]);
            event.target.value = ""; // allow choosing the same files again
          }}
        />
        {canRequestScan && (
          <Button variant="gold" size="sm" onClick={() => onScan(item)}>
            <Icon name="scan" className="h-4 w-4" /> Request 3D scan
          </Button>
        )}
      </div>
    </li>
  );
}

export default function MyListings() {
  const [result, setResult] = useState({ items: null, error: "" });
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null); // full Listing being edited
  const [scanning, setScanning] = useState(null); // item asking for a scan
  const [busy, setBusy] = useState({ id: null, what: null });
  const [notice, setNotice] = useState({ tone: "", text: "" });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMyListings()
      .then((items) => !cancelled && setResult({ items, error: "" }))
      .catch((err) => !cancelled && setResult({ items: [], error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = () => setVersion((v) => v + 1);
  const say = (tone, text) => setNotice({ tone, text });

  async function handleEdit(item) {
    setBusy({ id: item.id, what: "edit" });
    try {
      setEditing(await getListing(item.id)); // full details for the form
    } catch (err) {
      say("danger", err.message);
    } finally {
      setBusy({ id: null, what: null });
    }
  }

  async function handlePhotos(item, files) {
    if (files.length === 0) return;
    const room = MAX_PHOTOS - item.imagesCount;
    if (files.length > room) return say("danger", `This listing can take ${room} more photos.`);
    const bad = files.find(
      (f) => !["image/jpeg", "image/png"].includes(f.type) || f.size > MAX_PHOTO_MB * 1024 * 1024,
    );
    if (bad) return say("danger", `${bad.name}: only .jpg or .png, up to ${MAX_PHOTO_MB} MB`);

    setBusy({ id: item.id, what: "photos" });
    try {
      await uploadListingImages(item.id, files);
      say(
        "success",
        `${files.length} photo${files.length === 1 ? "" : "s"} added to ${item.title}.`,
      );
      reload();
    } catch (err) {
      say("danger", err.message);
    } finally {
      setBusy({ id: null, what: null });
    }
  }

  const items = result.items ?? [];
  const shown = filter === "all" ? items : items.filter((i) => i.status === filter);
  const totals = {
    live: items.filter((i) => i.status === LISTING_STATUS.LIVE).length,
    saves: items.reduce((sum, i) => sum + i.saves, 0),
    pending: items.reduce((sum, i) => sum + i.pendingBookings, 0),
  };

  return (
    <main className="page space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Seller</p>
          <h1 className="page-title mt-2">My listings</h1>
          <p className="mt-2 text-muted">Edit details, add photos and get your homes scanned.</p>
        </div>
        <Button to={ROUTES.SCAN_REQUEST}>
          <Icon name="plus" className="h-4 w-4" /> List a new property
        </Button>
      </header>

      {result.items && items.length > 0 && (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon="home" label="Listings" value={items.length} />
          <Stat icon="check" label="Live now" value={totals.live} />
          <Stat icon="heart" label="Times saved" value={totals.saves} />
          <Stat icon="calendar" label="Bookings to answer" value={totals.pending} />
        </section>
      )}

      {notice.text && (
        <p
          role="status"
          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${
            notice.tone === "success"
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-danger"
          }`}
        >
          {notice.text}
          <button type="button" aria-label="Dismiss" onClick={() => say("", "")}>
            <Icon name="x" className="h-4 w-4" />
          </button>
        </p>
      )}

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count =
              f.key === "all" ? items.length : items.filter((i) => i.status === f.key).length;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  filter === f.key
                    ? "bg-ink text-white"
                    : "bg-surface text-muted ring-1 ring-border hover:text-ink"
                }`}
              >
                {f.label} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {result.error ? (
        <EmptyState
          icon="alert"
          tone="danger"
          title="Couldn't load your listings"
          text={result.error}
        />
      ) : result.items === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon="home"
          title={items.length === 0 ? "No listings yet" : "Nothing in this group"}
          text={
            items.length === 0
              ? "Add your first property. Our team scans it and makes a 3D tour for buyers."
              : "Try another filter."
          }
          action={
            items.length === 0 && (
              <Button to={ROUTES.SCAN_REQUEST}>
                <Icon name="plus" className="h-4 w-4" /> List your property
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((item) => (
            <ListingRow
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onScan={setScanning}
              onPhotos={handlePhotos}
              busy={busy.id === item.id ? busy.what : null}
            />
          ))}
        </ul>
      )}

      {editing && (
        <EditListingDialog
          listing={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setEditing(null);
            say("success", `Saved changes to ${updated.title}.`);
            reload();
          }}
        />
      )}
      {scanning && (
        <RequestScanDialog
          listing={scanning}
          onClose={() => setScanning(null)}
          onRequested={() => {
            setScanning(null);
            say("success", `Scan requested for ${scanning.title}. Our team will contact you.`);
            reload();
          }}
        />
      )}
    </main>
  );
}
