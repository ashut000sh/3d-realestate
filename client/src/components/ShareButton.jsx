// Share a listing or its 3D tour.
// Phones: the system share sheet (navigator.share), which lists WhatsApp, Viber, Messenger...
// Elsewhere: a small menu with WhatsApp, Viber, Facebook and "Copy link".
//
// <ShareButton url={shareLink(id)} text={shareText(listing)} title={listing.title} />
// <ShareButton ... variant="glass" />   for dark screens (the Tour page)
// `url` should be a /share/... link so the chat app shows a preview (utils/shareLink.js).
import { useEffect, useRef, useState } from "react";
import { useToast } from "../hooks/useToast.jsx";
import Icon from "./Icon.jsx";

// Clipboard API needs https (or localhost) and a focused page. If it's missing or refuses,
// fall back to the old way.
async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // try the fallback below
    }
  }
  const box = document.createElement("textarea");
  box.value = value;
  box.setAttribute("readonly", "");
  box.style.cssText = "position:fixed;opacity:0;top:0;left:0";
  document.body.appendChild(box);
  box.select();
  const ok = document.execCommand("copy");
  box.remove();
  if (!ok) throw new Error("copy failed");
}

const VARIANTS = {
  labelled:
    "h-11 w-full gap-2 rounded-lg border border-border bg-surface px-4 text-small text-text hover:border-muted/50 hover:bg-sand/50",
  quiet: "h-11 w-full justify-start gap-2 rounded-lg px-2 text-small text-text hover:bg-sand/70",
  glass: "glass h-11 gap-2 rounded-xl px-4 text-small text-white hover:bg-white/10",
};

export default function ShareButton({ url, text, title, variant = "labelled", className = "" }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const boxRef = useRef(null);
  const message = `${text}: ${url}`;

  // Close the menu on a click outside or Escape
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // "Copied!" on the button for a moment
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleClick() {
    // Phones (touch screens) with the share sheet: use it
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return; // closed the sheet
        // anything else (e.g. not allowed here): fall through to the menu
      }
    }
    setOpen((v) => !v);
  }

  async function handleCopy() {
    try {
      await copyText(url);
      setCopied(true);
      toast("Copied!");
    } catch {
      toast("Couldn't copy the link", { tone: "error" });
    }
    setOpen(false);
  }

  const encoded = encodeURIComponent(message);
  const targets = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encoded}`, dot: "bg-[#25d366]" },
    { label: "Viber", href: `viber://forward?text=${encoded}`, dot: "bg-[#7360f2]" },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      dot: "bg-[#1877f2]",
    },
  ];

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center justify-center font-medium transition-colors ${VARIANTS[variant]}`}
      >
        <Icon name={copied ? "check" : "share"} className="h-4.5 w-4.5" />
        {copied ? "Copied!" : "Share"}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Share this home"
          className={`absolute ${variant === "quiet" ? "left-0" : "right-0"} z-40 mt-2 w-60 animate-scale-in rounded-xl border border-border bg-surface p-1.5 text-text shadow-[var(--shadow-float)]`}
        >
          {targets.map((t) => (
            <a
              key={t.label}
              role="menuitem"
              href={t.href}
              target={t.label === "Viber" ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-small font-medium hover:bg-sand"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} /> {t.label}
            </a>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-small font-medium hover:bg-sand"
          >
            <Icon name="copy" className="h-4 w-4 text-muted" /> Copy link
          </button>
          <p className="mx-3 mt-1 mb-1.5 truncate border-t border-border pt-2 text-xs text-muted">
            {url}
          </p>
        </div>
      )}
    </div>
  );
}
