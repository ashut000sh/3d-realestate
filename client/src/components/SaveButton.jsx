// Heart button that saves a listing. Works inside a card link (it doesn't open the listing).
// <SaveButton listingId={7} />                     round icon button for photos
// <SaveButton listingId={7} variant="labelled" />  "Save" / "Saved" button
// <SaveButton listingId={7} variant="quiet" />     small text action (listing page action row)
// Saving gives the heart a short pop (none with reduced motion); the photo button has a 44px
// tap area around its 36px circle.
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
  const [pop, setPop] = useState(false); // true right after saving: plays the heart pop once
  const saved = isSaved(listingId);

  async function handleClick(event) {
    event.preventDefault(); // inside a card <Link>: don't open the listing
    event.stopPropagation();
    const result = await toggle(listingId);
    if (result.needsLogin) {
      navigate(ROUTES.LOGIN, { state: { from: location.pathname + location.search } });
    } else {
      setError(result.ok ? "" : result.error);
      if (result.ok && !saved) setPop(true);
    }
  }

  const label = saved ? "Remove from saved homes" : "Save this home";
  const heart = (
    <Icon
      name="heart"
      onAnimationEnd={() => setPop(false)}
      className={`h-4.5 w-4.5 transition-colors duration-200 ${saved ? "fill-current text-danger" : ""} ${
        pop ? "animate-[heart-pop_240ms_var(--ease-out)]" : ""
      }`}
    />
  );

  if (variant === "quiet") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        title={error || label}
        className={`flex h-11 items-center gap-2 rounded-lg px-2 text-small font-medium transition-colors hover:bg-sand/70 ${
          saved ? "text-danger" : "text-text"
        } ${className}`}
      >
        {heart}
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  if (variant === "labelled") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        title={error || label}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-small font-semibold transition-colors ${
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
      className={`group/heart flex h-11 w-11 items-center justify-center ${className}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-[var(--shadow-float)] transition-transform duration-200 group-hover/heart:scale-105 group-active/heart:scale-95">
        {heart}
      </span>
    </button>
  );
}
