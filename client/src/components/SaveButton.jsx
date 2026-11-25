// Heart button that saves a listing. Works inside a card link (it doesn't open the listing).
// <SaveButton listingId={7} />                     round icon button for photos
// <SaveButton listingId={7} variant="labelled" />  "Save" / "Saved" button for the listing page
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes.js";
import { useSaved } from "../hooks/useSaved.js";
import Icon from "./Icon.jsx";

export default function SaveButton({ listingId, variant = "icon", className = "" }) {
  const { isSaved, toggle } = useSaved();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const saved = isSaved(listingId);

  async function handleClick(event) {
    event.preventDefault(); // inside a card <Link>: don't open the listing
    event.stopPropagation();
    const result = await toggle(listingId);
    if (result.needsLogin) {
      navigate(ROUTES.LOGIN, { state: { from: location.pathname + location.search } });
    } else {
      setError(result.ok ? "" : result.error);
    }
  }

  const label = saved ? "Remove from saved homes" : "Save this home";
  const heart = (
    <Icon
      name="heart"
      className={`h-4.5 w-4.5 transition ${saved ? "fill-current text-danger" : ""}`}
    />
  );

  if (variant === "labelled") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        title={error || label}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-[15px] font-semibold transition active:scale-[0.98] ${
          saved
            ? "border-danger/30 bg-danger-soft text-danger"
            : "border-border bg-surface text-text hover:border-muted/40 hover:bg-sand/60"
        } ${className}`}
      >
        {heart}
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={label}
      title={error || label}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm backdrop-blur transition hover:scale-110 active:scale-95 ${className}`}
    >
      {heart}
    </button>
  );
}
