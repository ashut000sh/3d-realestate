// Screen:    ScanRequest
// URL:       ROUTES.SCAN_REQUEST  ("/sell/scan-request")
// Owner:     M3  (see docs/TEAM.md)
// Wireframe: 11 Seller Scan Request
// Job:       Seller asks our team to come and LiDAR-scan the property. Calls SCANS.CREATE.
//
// Step 1 property details -> Step 2 photos -> Step 3 scan request, then "My properties" below.
// Logged out: a prompt to log in. Buyers/admins: a note that this is for seller accounts.
import { useEffect, useState } from "react";
import { ROLES } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Icon from "../../components/Icon.jsx";
import Input, { Textarea } from "../../components/Input.jsx";
import Loader from "../../components/Loader.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { useAuth } from "../../hooks/useAuth.jsx";
import { createListing, uploadListingImages } from "../../services/listings.service.js";
import { requestScan } from "../../services/scans.service.js";
import MyProperties from "./MyProperties.jsx";
import PropertyForm from "./PropertyForm.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const STEPS = [
  { label: "Property details", icon: "home" },
  { label: "Photos", icon: "camera" },
  { label: "Scan visit", icon: "scan" },
];
const MAX_PHOTOS = 10;
const MAX_PHOTO_MB = 5;
const PHOTO_TYPES = ["image/jpeg", "image/png"];

// "YYYY-MM-DD" in the user's time zone, `days` from today
function localDate(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function StepBar({ step }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {STEPS.map((s, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={s.label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                done
                  ? "bg-primary text-white"
                  : current
                    ? "bg-ink text-white ring-4 ring-primary/15"
                    : "bg-sand text-muted"
              }`}
            >
              {done ? <Icon name="check" className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
            </span>
            <span
              className={`hidden text-sm font-medium sm:block ${current || done ? "text-ink" : "text-muted"}`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span className={`h-0.5 flex-1 rounded-full ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p
      className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
      role="alert"
    >
      <Icon name="alert" className="h-4 w-4 shrink-0" /> {children}
    </p>
  );
}

export default function ScanRequest() {
  const { user, ready } = useAuth();
  const [step, setStep] = useState(0); // 0, 1, 2, or 3 = done
  const [listing, setListing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState([]); // [{ file, url }] url = preview
  const [dragging, setDragging] = useState(false);
  const [scan, setScan] = useState({ preferredDate: localDate(3), notes: "" });
  const [refreshKey, setRefreshKey] = useState(0);

  // Free the preview images when they are replaced or the page closes
  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  usePageTitle("List your property");

  if (!ready) return <Loader fullScreen />;

  if (!user || user.role !== ROLES.SELLER) {
    return (
      <main className="page">
        <section className="grain relative overflow-hidden rounded-[32px] bg-ink px-6 py-14 text-center text-white sm:px-12">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/60 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <p className="eyebrow text-accent">For owners</p>
            <h1 className="display mt-3 text-4xl leading-tight sm:text-5xl">
              List your property. We'll make the 3D tour.
            </h1>
            <p className="mt-4 text-white/70">
              Add your home, pick a day, and our team visits with a LiDAR scanner. Your listing goes
              live with a true-to-scale 3D tour.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {user ? (
                <p className="glass rounded-2xl px-5 py-3 text-sm">
                  You're logged in with a {user.role} account. Listing a property needs a seller
                  account.
                </p>
              ) : (
                <>
                  <Button
                    to={ROUTES.LOGIN}
                    state={{ from: ROUTES.SCAN_REQUEST }}
                    variant="gold"
                    size="lg"
                  >
                    Log in with a seller account
                  </Button>
                  <Button to={ROUTES.SIGNUP} variant="light" size="lg">
                    Create a seller account
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Step 1: create the listing (it starts as a draft)
  async function handleProperty(form) {
    setBusy(true);
    setError("");
    try {
      setListing(await createListing(form));
      setStep(1);
    } catch (err) {
      setError(err.status === 403 ? "Only seller accounts can add properties." : err.message);
    } finally {
      setBusy(false);
    }
  }

  // Step 2: check the chosen photos before upload
  function choosePhotos(fileList) {
    const chosen = [...fileList];
    const bad = chosen.find(
      (file) => !PHOTO_TYPES.includes(file.type) || file.size > MAX_PHOTO_MB * 1024 * 1024,
    );
    if (chosen.length > MAX_PHOTOS) return setError(`Choose at most ${MAX_PHOTOS} photos`);
    if (bad) return setError(`${bad.name}: only .jpg or .png, up to ${MAX_PHOTO_MB} MB`);
    setError("");
    setPhotos(chosen.map((file) => ({ file, url: URL.createObjectURL(file) })));
  }

  function removePhoto(index) {
    setPhotos((list) => list.filter((_, i) => i !== index));
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (photos.length === 0) return setError("Choose at least 1 photo, or skip this step");
    setBusy(true);
    setError("");
    try {
      await uploadListingImages(
        listing.id,
        photos.map((p) => p.file),
      );
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Step 3: ask our team to come and scan
  async function handleScan(event) {
    event.preventDefault();
    if (!scan.preferredDate || scan.preferredDate < localDate()) {
      return setError("Choose today or a later date");
    }
    setBusy(true);
    setError("");
    try {
      await requestScan({
        listingId: listing.id,
        preferredDate: scan.preferredDate,
        notes: scan.notes.trim() || null,
      });
      setStep(3);
      setRefreshKey((key) => key + 1); // show the new request in "My properties"
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    setStep(0);
    setListing(null);
    setPhotos([]);
    setScan({ preferredDate: localDate(3), notes: "" });
    setError("");
  }

  return (
    <main className="page space-y-14">
      <section className="grid gap-10 lg:grid-cols-[1fr_minmax(0,2fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">Seller studio</p>
          <h1 className="page-title mt-2">List your property</h1>
          <p className="mt-3 text-muted">
            Add your home, then our team visits with a LiDAR scanner and creates its 3D tour. Free
            for sellers.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            {[
              ["cube", "A 3D tour makes your listing stand out"],
              ["users", "Fewer wasted viewings, more serious buyers"],
              ["shield", "Your listing goes live after the scan"],
            ].map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                  <Icon name={icon} className="h-[18px] w-[18px]" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          {step < 3 && <StepBar step={step} />}

          <div className="card p-6 sm:p-8">
            {step === 0 && (
              <PropertyForm onSubmit={handleProperty} submitting={busy} serverError={error} />
            )}

            {step === 1 && (
              <form onSubmit={handleUpload} className="space-y-5">
                <div>
                  <h2 className="display text-2xl text-ink">Add photos</h2>
                  <p className="mt-1 text-sm text-muted">
                    Up to {MAX_PHOTOS} photos, .jpg or .png, {MAX_PHOTO_MB} MB each. The first one
                    is the cover.
                  </p>
                </div>
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    choosePhotos(e.dataTransfer.files);
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                    dragging
                      ? "border-primary bg-primary-soft/50"
                      : "border-border hover:border-primary/50 hover:bg-sand/40"
                  }`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Icon name="upload" className="h-6 w-6" />
                  </span>
                  <span className="mt-3 font-semibold text-ink">
                    Drop photos here or click to choose
                  </span>
                  <span className="mt-1 text-sm text-muted">
                    JPG or PNG · max {MAX_PHOTO_MB} MB each
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    multiple
                    onChange={(e) => choosePhotos(e.target.files)}
                    className="sr-only"
                  />
                </label>
                {photos.length > 0 && (
                  <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {photos.map((photo, i) => (
                      <li key={photo.url} className="group relative">
                        <img
                          src={photo.url}
                          alt={photo.file.name}
                          className="aspect-square w-full rounded-xl object-cover ring-1 ring-border"
                        />
                        {i === 0 && (
                          <span className="absolute top-1.5 left-1.5 rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-white">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          aria-label={`Remove ${photo.file.name}`}
                          className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-muted opacity-0 shadow transition group-hover:opacity-100 hover:text-danger focus:opacity-100"
                        >
                          <Icon name="x" className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <ErrorNote>{error}</ErrorNote>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" loading={busy}>
                    {busy ? "Uploading..." : "Upload and continue"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setError("");
                      setStep(2);
                    }}
                  >
                    Skip for now
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleScan} className="space-y-5">
                <div>
                  <h2 className="display text-2xl text-ink">Book the scan visit</h2>
                  <p className="mt-1 text-sm text-muted">
                    When can our team visit{" "}
                    <span className="font-semibold text-ink">{listing.title}</span>? We confirm the
                    exact time with you. A visit takes about an hour.
                  </p>
                </div>
                <Input
                  label="Preferred date"
                  name="preferredDate"
                  type="date"
                  icon="calendar"
                  min={localDate()}
                  value={scan.preferredDate}
                  onChange={(e) => setScan({ ...scan, preferredDate: e.target.value })}
                />
                <Textarea
                  label="Notes for the visit"
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Gate code, best time, who will open the door..."
                  value={scan.notes}
                  onChange={(e) => setScan({ ...scan, notes: e.target.value })}
                />
                <ErrorNote>{error}</ErrorNote>
                <Button type="submit" size="lg" className="w-full" loading={busy}>
                  <Icon name="scan" className="h-5 w-5" /> {busy ? "Sending..." : "Request a scan"}
                </Button>
              </form>
            )}

            {step === 3 && (
              <div className="animate-scale-in py-6 text-center">
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success">
                  <Icon name="check" className="h-10 w-10" strokeWidth={2.5} />
                </span>
                <h2 className="display mt-6 text-3xl text-ink">Scan requested</h2>
                <p className="mx-auto mt-3 max-w-md text-muted">
                  Our team will contact you to confirm the visit. Your listing goes live with its 3D
                  tour after the scan.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button onClick={startOver}>
                    <Icon name="plus" className="h-4 w-4" /> Add another property
                  </Button>
                  <Button to={buildRoute(ROUTES.LISTING, { id: listing.id })} variant="secondary">
                    View listing
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6">
          <p className="eyebrow">Your dashboard</p>
          <h2 className="page-title mt-2">My properties</h2>
        </div>
        <MyProperties refreshKey={refreshKey} />
      </section>
    </main>
  );
}
