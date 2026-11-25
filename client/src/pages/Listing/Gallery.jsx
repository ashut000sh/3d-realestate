// Photo gallery for the Listing page: one big photo and thumbnails to switch. Owner: M3.
import { useState } from "react";
import { mediaUrl } from "../../utils/mediaUrl.js";

export default function Gallery({ images, title }) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="card flex aspect-[16/9] items-center justify-center text-muted">
        No photos yet
      </div>
    );
  }

  const index = Math.min(current, images.length - 1);
  const go = (step) => setCurrent((index + step + images.length) % images.length);

  return (
    <div className="space-y-3">
      <div className="card relative aspect-[16/9] overflow-hidden p-0">
        <img
          src={mediaUrl(images[index])}
          alt={`${title}, photo ${index + 1} of ${images.length}`}
          className="h-full w-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-surface/90 px-3 py-1.5 text-lg shadow"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-surface/90 px-3 py-1.5 text-lg shadow"
            >
              ›
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-text/70 px-2.5 py-1 text-xs text-white">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={mediaUrl(url)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
