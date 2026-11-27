// Pop-up to ask our team to scan an existing listing (POST /api/scan-requests).
import { useState } from "react";
import Button from "../../components/Button.jsx";
import Dialog from "../../components/Dialog.jsx";
import Input, { Textarea } from "../../components/Input.jsx";
import { requestScan } from "../../services/scans.service.js";

function localDate(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function RequestScanDialog({ listing, onClose, onRequested }) {
  const [preferredDate, setPreferredDate] = useState(localDate(3));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!preferredDate || preferredDate < localDate())
      return setError("Choose today or a later date");
    setBusy(true);
    setError("");
    try {
      onRequested(
        await requestScan({ listingId: listing.id, preferredDate, notes: notes.trim() || null }),
      );
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Dialog title="Request a 3D scan" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">
          Our team visits <span className="font-medium text-text">{listing.title}</span> with a
          LiDAR scanner. The listing goes live with its 3D tour after the scan.
        </p>
        <Input
          label="Preferred date"
          name="preferredDate"
          type="date"
          min={localDate()}
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
        />
        <Textarea
          label="Notes for the visit"
          name="notes"
          rows={3}
          placeholder="Gate code, best time, who will open the door..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Request scan
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
