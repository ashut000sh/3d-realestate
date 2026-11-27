// Small inline icon set (24x24, stroke icons). No icon library needed.
// <Icon name="search" className="h-5 w-5" />
const PATHS = {
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35",
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z",
  cube: "M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 0v20M3 7l9 5 9-5",
  pin: "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  bed: "M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 14h18M3 18v2m18-2v2M7 9V6h4v3",
  bath: "M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Zm2 0V5a2 2 0 0 1 4 0M7 20l-1 2m12-2 1 2",
  area: "M4 4h6M4 4v6M20 4h-6M20 4v6M4 20h6M4 20v-6M20 20h-6M20 20v-6",
  calendar: "M4 6h16v15H4V6Zm0 4h16M8 3v4m8-4v4",
  chat: "M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.4A8 8 0 1 1 21 12Z",
  heart: "M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9Z",
  compare: "M8 3v18M16 3v18M3 8h5M16 16h5",
  plus: "M12 5v14M5 12h14",
  check: "m5 12 5 5 9-11",
  x: "M6 6l12 12M18 6 6 18",
  arrowRight: "M5 12h14m-6-6 6 6-6 6",
  arrowLeft: "M19 12H5m6-6-6 6 6 6",
  chevronLeft: "m15 6-6 6 6 6",
  chevronRight: "m9 6 6 6-6 6",
  chevronDown: "m6 9 6 6 6-6",
  menu: "M4 7h16M4 12h16M4 17h16",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z",
  shieldCheck: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Zm-3.5 9 2.5 2.5 4.5-5",
  mailCheck: "M4 6h16v7M4 6v12h9M4 6l8 7 8-7m-5 12 2 2 4-4",
  mail: "M4 6h16v12H4V6Zm0 0 8 7 8-7",
  lock: "M6 11h12v10H6V11Zm2 0V8a4 4 0 0 1 8 0v3",
  phone:
    "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  eyeOff:
    "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.3 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2",
  camera: "M4 8h3l2-3h6l2 3h3v12H4V8Zm8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  upload: "M12 16V4m-5 5 5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  ruler: "M3 17 17 3l4 4L7 21l-4-4Zm4-4 2 2m1-5 2 2m1-5 2 2",
  rotate: "M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5",
  expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  send: "m4 12 16-8-6 16-2.5-6.5L4 12Z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z",
  key: "M15 8a4 4 0 1 1-3.5 6L4 21l-1-1 1-3h3v-3h3l1.5-1.5A4 4 0 0 1 15 8Zm1 0h.01",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  users:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 10a7 7 0 0 1 14 0m1-10a3 3 0 1 0 0-6m5 16a6 6 0 0 0-4-5.6",
  clock: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm0-13v4l3 2",
  info: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm0-10v6m0-9h.01",
  alert: "M12 3 2 20h20L12 3Zm0 6v5m0 3h.01",
  image: "M4 5h16v14H4V5Zm0 11 5-5 4 4 2-2 5 5M15 9h.01",
  trash: "M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3",
  filter: "M4 5h16l-6 8v6l-4-2v-4L4 5Z",
  map: "m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14",
  grid: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z",
  scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16",
  play: "M7 4v16l13-8L7 4Z",
  external: "M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  // Nearby places
  school: "M2 9l10-5 10 5-10 5L2 9Zm4 2v5c2 2 10 2 12 0v-5M22 9v6",
  health: "M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z",
  pill: "M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7l7-7ZM7 10l7 7",
  bus: "M5 4h14v13H5V4Zm0 8h14M8 17v3m8-3v3M8 14.5h.01M16 14.5h.01",
  temple: "M12 2v3m-5 5 5-5 5 5M5 10h14M6 10v10m12-10v10M3 21h18M10 21v-5h4v5",
  cart: "M3 4h2l2.4 11h11.2L21 7H6.2M9 20h.01M18 20h.01",
  bank: "M3 9 12 4l9 5M4 10h16M6 10v8m4-8v8m4-8v8m4-8v8M3 20h18",
  walk: "M13 4h.01M10 21l2-6 3 3v3m-6-9 3-3 3 3 3 1M9 12l-2 4",
  share:
    "M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  copy: "M9 9h11v11H9V9ZM5 15H4V4h11v1",
};

// The raw path data, for places that need an icon outside React (map markers)
export const ICON_PATHS = PATHS;

export default function Icon({ name, className = "h-5 w-5", strokeWidth = 1.8, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <path d={PATHS[name] ?? PATHS.info} />
    </svg>
  );
}
