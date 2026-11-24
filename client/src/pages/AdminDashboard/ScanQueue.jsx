// Admin scan queue: one card per scan request, with the actions its status allows.
// Status rules come from the scans API:
//   pending   -> schedule a visit, or cancel
//   scheduled -> reschedule, mark scanned, upload the tour, or cancel
//   scanned   -> upload the tour (that publishes it), or cancel
//   published / cancelled -> nothing more to do
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SCAN_STATUS } from "@realestate/shared";
import Badge from "../../components/Badge.jsx";
import Button from "../../components/Button.jsx";
import Icon from "../../components/Icon.jsx";
import { ROUTES, buildRoute } from "../../constants/routes.js";
import { updateScanStatus, uploadTour } from "../../services/admin.service.js";

export const STATUS_META = {
  [SCAN_STATUS.PENDING]: { label: "Pending", tone: "warning" },
  [SCAN_STATUS.SCHEDULED]: { label: "Scheduled", tone: "info" },
  [SCAN_STATUS.SCANNED]: { label: "Scanned", tone: "primary" },
  [SCAN_STATUS.PUBLISHED]: { label: "Published", tone: "success" },
  [SCAN_STATUS.CANCELLED]: { label: "Cancelled", tone: "neutral" },
};

const MAX_TOUR_MB = 200;

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

// "2026-12-21T10:00" in the admin's browser time -> ISO string with the right offset
const toIso = (local) => new Date(local).toISOString();

function ScanCard({ request, onChanged }) {
  const [mode, setMode] = useState(null); // "schedule" | null
  const [when, setWhen] = useState(request.preferredDate ? `${request.preferredDate}T10:00` : "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const fileRef = useRef(null);
  const meta = STATUS_META[request.status];

  async function change(status, scheduledFor) {
    setBusy(status);
    setError("");
    try {
      const updated = await updateScanStatus(request.id, status, scheduledFor);
      setMode(null);
      onChanged(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".glb")) return setError("Choose a .glb file");
    if (file.size > MAX_TOUR_MB * 1024 * 1024)
      return setError(`The file is over ${MAX_TOUR_MB} MB`);
    setBusy("upload");
    setError("");
    setUploadProgress(`Uploading ${(file.size / 1024 / 1024).toFixed(1)} MB…`);
    try {
      const tourUrl = await uploadTour(request.id, file);
      onChanged({ ...request, status: SCAN_STATUS.PUBLISHED, tourUrl });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
      setUploadProgress("");
    }
  }

  const canSchedule =
    request.status === SCAN_STATUS.PENDING || request.status === SCAN_STATUS.SCHEDULED;
  const canUpload =
    request.status === SCAN_STATUS.SCHEDULED || request.status === SCAN_STATUS.SCANNED;
  const canCancel = [SCAN_STATUS.PENDING, SCAN_STATUS.SCHEDULED, SCAN_STATUS.SCANNED].includes(
    request.status,
  );

  return (
    <li className="card animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
            <span className="text-xs text-muted">Request #{request.id}</span>
          </div>
          <Link
            to={buildRoute(ROUTES.LISTING, { id: request.listingId })}
            className="mt-2 block truncate text-lg font-semibold text-ink hover:text-primary"
          >
            {request.listingTitle}
          </Link>
          <p className="text-sm text-muted">Seller: {request.sellerFullName}</p>
        </div>
        <div className="text-right text-sm">
          {request.scheduledFor ? (
            <p className="flex items-center gap-1.5 font-semibold text-info">
              <Icon name="calendar" className="h-4 w-4" /> {formatDateTime(request.scheduledFor)}
            </p>
          ) : (
            <p className="text-muted">
              Prefers{" "}
              <span className="font-medium text-text">{request.preferredDate ?? "any day"}</span>
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted">
            Asked {new Date(request.createdAt).toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>

      {request.notes && (
        <p className="mt-3 rounded-xl bg-sand/70 px-3 py-2 text-sm text-text">
          <span className="font-medium">Notes:</span> {request.notes}
        </p>
      )}

      {mode === "schedule" && (
        <form
          className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!when) return setError("Pick a date and time");
            change(SCAN_STATUS.SCHEDULED, toIso(when));
          }}
        >
          <label className="flex-1">
            <span className="label">Visit date and time</span>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="field"
              required
            />
          </label>
          <Button type="submit" loading={busy === SCAN_STATUS.SCHEDULED}>
            Save visit
          </Button>
          <Button type="button" variant="ghost" onClick={() => setMode(null)}>
            Close
          </Button>
        </form>
      )}

      {error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-danger">
          <Icon name="alert" className="h-4 w-4" /> {error}
        </p>
      )}
      {uploadProgress && <p className="mt-3 text-sm text-info">{uploadProgress}</p>}

      {(canSchedule || canUpload || canCancel || request.status === SCAN_STATUS.PUBLISHED) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {canSchedule && mode !== "schedule" && (
            <Button
              size="sm"
              variant={request.status === SCAN_STATUS.PENDING ? "primary" : "secondary"}
              onClick={() => setMode("schedule")}
            >
              <Icon name="calendar" className="h-4 w-4" />
              {request.status === SCAN_STATUS.PENDING ? "Schedule visit" : "Reschedule"}
            </Button>
          )}
          {request.status === SCAN_STATUS.SCHEDULED && (
            <Button
              size="sm"
              variant="secondary"
              loading={busy === SCAN_STATUS.SCANNED}
              onClick={() => change(SCAN_STATUS.SCANNED)}
            >
              <Icon name="scan" className="h-4 w-4" /> Mark scanned
            </Button>
          )}
          {canUpload && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".glb,model/gltf-binary"
                className="hidden"
                onChange={handleFile}
              />
              <Button
                size="sm"
                variant="gold"
                loading={busy === "upload"}
                onClick={() => fileRef.current?.click()}
              >
                <Icon name="upload" className="h-4 w-4" /> Upload tour & publish
              </Button>
            </>
          )}
          {request.status === SCAN_STATUS.PUBLISHED && (
            <Button
              size="sm"
              variant="secondary"
              to={buildRoute(ROUTES.TOUR, { id: request.listingId })}
            >
              <Icon name="cube" className="h-4 w-4" /> Open tour
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-danger hover:bg-danger-soft"
              loading={busy === SCAN_STATUS.CANCELLED}
              onClick={() => change(SCAN_STATUS.CANCELLED)}
            >
              Cancel request
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export default function ScanQueue({ requests, onChanged }) {
  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <ScanCard key={request.id} request={request} onChanged={onChanged} />
      ))}
    </ul>
  );
}
