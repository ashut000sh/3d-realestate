// Confirmation before giving or removing a seller's "Verified seller" badge.
// <VerifySellerDialog person={user} onClose={...} onDone={(result) => ...} />
// person.sellerVerifiedAt set = remove the badge; not set = give it.
import { useState } from "react";
import Button from "../../components/Button.jsx";
import Dialog from "../../components/Dialog.jsx";
import Icon from "../../components/Icon.jsx";
import { VerifiedBadge } from "../../components/TrustBadges.jsx";
import { unverifySeller, verifySeller } from "../../services/admin.service.js";

export default function VerifySellerDialog({ person, onClose, onDone }) {
  const removing = Boolean(person.sellerVerifiedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setBusy(true);
    setError("");
    try {
      const result = removing ? await unverifySeller(person.id) : await verifySeller(person.id);
      onDone(result);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Dialog title={removing ? "Remove verification?" : "Verify this seller?"} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl bg-sand/60 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
            <Icon name="shieldCheck" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{person.fullName}</p>
            <p className="truncate text-sm text-muted">{person.email}</p>
          </div>
        </div>

        {removing ? (
          <p className="text-text/85">
            The <strong>Verified seller</strong> badge disappears from all of {person.fullName}'s
            listings and chats straight away. Do this if their documents turned out to be wrong or
            out of date.
          </p>
        ) : (
          <>
            <p className="text-text/85">
              Only confirm if our team has seen these documents <strong>in person</strong>:
            </p>
            <ul className="space-y-2 text-sm text-text/85">
              {[
                "Citizenship certificate, with the name matching this account",
                "Lalpurja (land ownership certificate) for the properties they list",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Icon name="check" className="mt-0.5 h-4 w-4 text-success" /> {line}
                </li>
              ))}
            </ul>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
              Buyers will then see <VerifiedBadge kind="seller" /> on their listings and in chat.
            </p>
          </>
        )}

        {error && (
          <p
            className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
            role="alert"
          >
            <Icon name="alert" className="h-4 w-4" /> {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={removing ? "danger" : "primary"} onClick={handleConfirm} loading={busy}>
            {removing ? "Remove verification" : "Yes, verify seller"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
