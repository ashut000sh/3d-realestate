// An <img> that never shows a broken-image icon. Same props as <img>.
// If the picture can't load (bad link, deleted file, offline), the same box shows a
// soft placeholder instead, so cards and galleries keep their shape.
// While loading, the image is transparent over its box's ivory/sand background and fades in
// once it arrives (no layout shift: the box always has its size).
// <Photo src={url} alt="Living room" className="h-full w-full object-cover" />
import { useState } from "react";
import Icon from "./Icon.jsx";

export default function Photo({ src, alt = "", className = "", onError, onLoad, style, ...props }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const [loadedSrc, setLoadedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className={`flex items-center justify-center bg-sand text-muted ${className}`}
      >
        <Icon name="image" className="h-7 w-7" />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`transition-opacity duration-500 ease-[var(--ease-out)] ${className}`}
      style={loadedSrc === src ? style : { ...style, opacity: 0 }}
      onLoad={(event) => {
        setLoadedSrc(src);
        onLoad?.(event);
      }}
      onError={(event) => {
        setFailedSrc(src); // a new src (next photo) gets its own try
        onError?.(event);
      }}
      {...props}
    />
  );
}
