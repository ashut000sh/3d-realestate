// Trust badges: what Aawas has checked about a listing or a person.
//   <VerifiedBadge kind="tour" />     our team scanned the property (a published scan)
//   <VerifiedBadge kind="seller" />   an admin checked the seller's documents in person
//   <VerifiedBadge kind="email" />    the person confirmed their email with a code
//   <TrustBadges tourVerified sellerVerified />   the listing badges that apply, in order
// size: "sm" (cards, chat) | "md" (listing page). onDark: for photos and dark panels.
// tipSide: "bottom" (default) or "top" (inside cards that clip what overflows them).
// tipAlign: "start" (tooltip grows to the right, default) or "end" (grows left; near a right edge).
// The tooltip opens on hover, keyboard focus and tap (title alone doesn't work on phones).
import { useId, useState } from "react";
import Icon from "./Icon.jsx";

export const BADGES = {
  tour: {
    icon: "scan",
    label: "Verified tour",
    tip: "Our team scanned this property in person. The 3D tour is the real home.",
    tone: "bg-accent-soft text-accent-dark ring-accent/30",
  },
  seller: {
    icon: "shieldCheck",
    label: "Verified seller",
    tip: "Our team checked this seller's documents (lalpurja or citizenship) in person.",
    tone: "bg-success-soft text-success ring-success/25",
  },
  email: {
    icon: "mailCheck",
    label: "Email verified",
    tip: "This person confirmed their email address with a one-time code.",
    tone: "bg-info-soft text-info ring-info/20",
  },
};

export function VerifiedBadge({
  kind,
  size = "sm",
  onDark = false,
  tipSide = "bottom",
  tipAlign = "start",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const badge = BADGES[kind];
  if (!badge) return null;
  const sizing = size === "md" ? "gap-1.5 px-3 py-1 text-sm" : "gap-1 px-2 py-0.5 text-xs";
  return (
    <span
      tabIndex={0}
      aria-describedby={tipId}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      onClick={(e) => {
        // Inside a card link: a tap explains the badge instead of opening the listing
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }}
      className={`relative inline-flex cursor-help items-center rounded-full font-semibold whitespace-nowrap ring-1 outline-none focus-visible:ring-2 focus-visible:ring-accent ${sizing} ${
        onDark ? "bg-white/95 text-ink shadow-sm ring-white/40" : badge.tone
      } ${className}`}
    >
      <Icon
        name={badge.icon}
        className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"}
        strokeWidth={2.2}
      />
      {badge.label}
      {/* Always in the DOM for screen readers; only shown (and only takes space) when open */}
      <span
        id={tipId}
        role="tooltip"
        className={
          open
            ? `absolute z-40 w-56 animate-fade-in rounded-xl bg-ink px-3 py-2 text-left text-xs leading-snug font-normal whitespace-normal text-white shadow-[var(--shadow-lift)] ${
                tipSide === "top" ? "bottom-full mb-2" : "top-full mt-2"
              } ${tipAlign === "end" ? "right-0" : "left-0"}`
            : "sr-only"
        }
      >
        {badge.tip}
      </span>
    </span>
  );
}

export default function TrustBadges({
  tourVerified,
  sellerVerified,
  size = "sm",
  onDark = false,
  tipSide = "bottom",
  className = "",
}) {
  if (!tourVerified && !sellerVerified) return null;
  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {tourVerified && <VerifiedBadge kind="tour" size={size} onDark={onDark} tipSide={tipSide} />}
      {sellerVerified && (
        <VerifiedBadge kind="seller" size={size} onDark={onDark} tipSide={tipSide} />
      )}
    </span>
  );
}
