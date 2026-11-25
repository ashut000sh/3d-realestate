// Uploaded photos and 3D tours come from the API as paths like "/uploads/listings/5/a.jpg".
// Those files live on the API server (port 4000), not the website (port 5173),
// so add the API address in front. Full URLs ("https://...") are returned unchanged.
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function mediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return new URL(path, API_URL).href;
}
