// Screen:    ScanRequest
// URL:       ROUTES.SCAN_REQUEST  ("/sell/scan-request")
// Owner:     M3  (see docs/TEAM.md)
// Wireframe: 11 Seller Scan Request
// Job:       Seller asks our team to come and LiDAR-scan the property. Calls SCANS.CREATE.
//
// Sellers only (Simon Khatri protects the route with role={ROLES.SELLER}).
// Step 1 property details -> Step 2 photos -> Step 3 scan request, then "My properties" below.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { tokenStore } from "../../services/api.js";
import { createListing, uploadListingImages } from "../../services/listings.service.js";
import { requestScan } from "../../services/scans.service.js";
import MyProperties from "./MyProperties.jsx";
import PropertyForm from "./PropertyForm.jsx";

const STEPS = ["Property details", "Photos", "Scan visit"];
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
    <ol className="flex gap-2 text-sm">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={`flex-1 border-t-4 pt-2 ${i <= step ? "border-primary font-medium" : "border-border text-muted"}`}
        >
          {i + 1}. {label}
        </li>
      ))}
    </ol>
  );
}

export default function ScanRequest() {
  const [step, setStep] = useState(0); // 0, 1, 2, or 3 = done
  const [listing, setListing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Chosen photos: [{ file, url }]. url is a preview link made ONCE when the photos are picked
  // (not on every redraw) and freed when they change or the page closes.
  const [files, setFiles] = useState([]);
  const previewUrls = useRef([]);
  const [scan, setScan] = useState({ preferredDate: localDate(3), notes: "" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  // Swaps the chosen photos and frees the old preview links
  function replaceFiles(chosen) {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    const next = chosen.map((file) => ({ file, url: URL.createObjectURL(file) }));
    previewUrls.current = next.map((item) => item.url);
    setFiles(next);
  }

  if (!tokenStore.get()) {
    return (
      <main className="page space-y-3">
        <h1 className="page-title">List your property</h1>
        <p className="text-muted">Log in with a seller account to add a property.</p>
        <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
          Log in
        </Link>
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
  function handleFiles(event) {
    const chosen = [...event.target.files];
    const bad = chosen.find(
      (file) => !PHOTO_TYPES.includes(file.type) || file.size > MAX_PHOTO_MB * 1024 * 1024,
    );
    if (chosen.length > MAX_PHOTOS) setError(`Choose at most ${MAX_PHOTOS} photos`);
    else if (bad) setError(`${bad.name}: only .jpg or .png, up to ${MAX_PHOTO_MB} MB`);
    else setError("");
    replaceFiles(chosen.length > MAX_PHOTOS || bad ? [] : chosen);
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (files.length === 0) return setError("Choose at least 1 photo, or skip this step");
    setBusy(true);
    setError("");
    try {
      await uploadListingImages(
        listing.id,
        files.map((item) => item.file),
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
    replaceFiles([]);
    setScan({ preferredDate: localDate(3), notes: "" });
    setError("");
  }

  return (
    <main className="page space-y-10">
      <section className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="page-title">List your property</h1>
          <p className="mt-1 text-muted">
            Add your property, then our team visits with a LiDAR scanner and makes a 3D tour.
          </p>
        </div>

        {step < 3 && <StepBar step={step} />}

        <div className="card">
          {step === 0 && (
            <PropertyForm onSubmit={handleProperty} submitting={busy} serverError={error} />
          )}

          {step === 1 && (
            <form onSubmit={handleUpload} className="space-y-4">
              <p className="text-sm text-muted">
                Up to {MAX_PHOTOS} photos, .jpg or .png, {MAX_PHOTO_MB} MB each. The first photo is
                the cover.
              </p>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                multiple
                onChange={handleFiles}
                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-white"
              />
              {files.length > 0 && (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {files.map(({ file, url }, i) => (
                    <li key={file.name + i} className="relative">
                      <img
                        src={url}
                        alt={file.name}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-primary px-1.5 text-xs text-white">
                          Cover
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={busy}>
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
                  Skip
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleScan} className="space-y-4">
              <p className="text-sm text-muted">
                When can our team visit <span className="font-medium">{listing.title}</span>? We
                confirm the exact time with you.
              </p>
              <Input
                label="Preferred date"
                name="preferredDate"
                type="date"
                min={localDate()}
                value={scan.preferredDate}
                onChange={(e) => setScan({ ...scan, preferredDate: e.target.value })}
              />
              <label htmlFor="notes" className="block">
                <span className="mb-1 block text-sm font-medium">Notes for the visit</span>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Gate code, best time, who will open the door..."
                  value={scan.notes}
                  onChange={(e) => setScan({ ...scan, notes: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
                />
              </label>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Sending..." : "Request a scan"}
              </Button>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-3 text-center">
              <p className="text-4xl" aria-hidden="true">
                ✓
              </p>
              <h2 className="text-xl font-semibold">Scan requested</h2>
              <p className="text-muted">
                Our team will contact you to confirm the visit. Your listing goes live with its 3D
                tour after the scan.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button onClick={startOver}>Add another property</Button>
                <Link
                  to={buildRoute(ROUTES.LISTING, { id: listing.id })}
                  className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-background"
                >
                  View listing
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-2xl">
        <MyProperties refreshKey={refreshKey} />
      </section>
    </main>
  );
}
