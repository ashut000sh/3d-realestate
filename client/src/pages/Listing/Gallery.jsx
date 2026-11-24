// Photo gallery for the Listing page. Owner: M3.
// Big screens: one large photo + two smaller ones (a "mosaic"). Phones: one photo with arrows.
// Clicking a photo opens a full-screen viewer with arrows, a "2 / 3" counter and thumbnails.
import { useEffect, useState } from "react";
import Icon from "../../components/Icon.jsx";
import { mediaUrl } from "../../utils/mediaUrl.js";

function Lightbox({ images, title, start, onClose }) {
  const [index, setIndex] = useState(start);
  const go = (step) => setIndex((i) => (i + step + images.length) % images.length);

  // Keyboard: arrows to move, Esc to close. Also stop the page behind from scrolling.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
    // go only uses the setter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[2000] flex animate-fade-in flex-col bg-ink/95 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photos`}
    >
      <div className="flex items-center justify-between p-4 text-white">
        <p className="text-sm font-medium tabular-nums">
          {index + 1} / {images.length}
        </p>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/10"
          aria-label="Close photos"
        >
          <Icon name="x" className="h-6 w-6" />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4">
        <img
          key={index}
          src={mediaUrl(images[index])}
          alt={`${title}, photo ${index + 1} of ${images.length}`}
          className="max-h-[75vh] max-w-full animate-scale-in rounded-2xl object-contain shadow-2xl"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <Icon name="chevronLeft" className="h-6 w-6" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <Icon name="chevronRight" className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
      <div className="flex justify-center gap-2 overflow-x-auto p-4">
        {images.map((url, i) => (
          <button
            key={url}
            onClick={() => setIndex(i)}
            aria-label={`Show photo ${i + 1}`}
            className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
              i === index ? "ring-accent" : "opacity-50 ring-transparent hover:opacity-100"
            }`}
          >
            <img src={mediaUrl(url)} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Gallery({ images, title, badge }) {
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(null); // index shown in the lightbox, or null

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 rounded-[28px] bg-sand text-muted">
        <Icon name="image" className="h-10 w-10 text-border" />
        No photos yet
      </div>
    );
  }

  const index = Math.min(current, images.length - 1);
  const go = (step) => setCurrent((index + step + images.length) % images.length);

  return (
    <>
      {/* Phones and tablets: one photo with arrows */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-sand md:hidden">
        <button className="h-full w-full" onClick={() => setOpen(index)} aria-label="Open photos">
          <img
            src={mediaUrl(images[index])}
            alt={`${title}, photo ${index + 1} of ${images.length}`}
            className="h-full w-full object-cover"
          />
        </button>
        {badge}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow"
            >
              <Icon name="chevronLeft" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow"
            >
              <Icon name="chevronRight" className="h-5 w-5" />
            </button>
            <span className="absolute right-3 bottom-3 rounded-full bg-ink/75 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Laptops: mosaic */}
      <div
        className={`relative hidden h-[460px] grid-rows-[460px] gap-3 md:grid ${images.length > 1 ? "grid-cols-[2fr_1fr]" : "grid-cols-1"}`}
      >
        <button
          onClick={() => setOpen(0)}
          className="group relative h-full min-h-0 overflow-hidden rounded-l-[28px] bg-sand"
          style={images.length === 1 ? { borderRadius: 28 } : undefined}
          aria-label="Open photo 1"
        >
          <img
            src={mediaUrl(images[0])}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        </button>
        {images.length > 1 && (
          <div className="grid min-h-0 grid-rows-2 gap-3">
            {images.slice(1, 3).map((url, i) => (
              <button
                key={url}
                onClick={() => setOpen(i + 1)}
                className={`group relative min-h-0 overflow-hidden bg-sand ${i === 0 ? "rounded-tr-[28px]" : "rounded-br-[28px]"} ${images.length === 2 ? "row-span-2 rounded-r-[28px]" : ""}`}
                aria-label={`Open photo ${i + 2}`}
              >
                <img
                  src={mediaUrl(url)}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
        )}
        {badge}
        <button
          onClick={() => setOpen(0)}
          className="absolute right-4 bottom-4 flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-sm font-semibold text-ink shadow-[var(--shadow-lift)] hover:bg-white"
        >
          <Icon name="grid" className="h-4 w-4" /> Show all {images.length} photos
        </button>
      </div>

      {open !== null && (
        <Lightbox images={images} title={title} start={open} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
