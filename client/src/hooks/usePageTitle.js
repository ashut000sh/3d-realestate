// Sets the browser tab title for a page: usePageTitle("Saved homes") -> "Saved homes · Aawas".
// Pass null/"" for just "Aawas · 3D homes in Nepal".
import { useEffect } from "react";

const APP = "Aawas";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP}` : `${APP} · 3D homes in Nepal`;
  }, [title]);
}
