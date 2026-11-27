// Aawas line-art illustrations. One style everywhere (docs/design/SYSTEM.md → Illustrations):
// 240 × 160 grid, ink lines at 1.5px (constant at any size: non-scaling-stroke), round caps and joins, no fills except ivory, and one
// gold (#c39a4b) detail per drawing. Think architect's sketch, not clip-art.
//
// <ScanRoom className="w-64" />   decorative by default (aria-hidden). Pass title="..." to label.
const INK = "#0e2a23";
const GOLD = "#c39a4b";
const IVORY = "#faf8f3";

function Frame({ title, className = "", children }) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      stroke={INK}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      // .illustration (index.css) keeps the line 1.5px at any size, to match the fine type
      className={`illustration ${className}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {children}
    </svg>
  );
}

// A phone held up in a room, its scan sweeping the far wall (how a LiDAR tour is made)
export function ScanRoom(props) {
  return (
    <Frame {...props}>
      {/* room in perspective */}
      <path d="M30 128 L70 104 L170 104 L210 128" />
      <path d="M70 104 V32 H170 V104" />
      <path d="M30 128 V20 L70 32 M210 128 V20 L170 32" />
      {/* window and a sofa */}
      <path d="M92 50 H126 V78 H92 Z M109 50 V78" />
      <path d="M134 104 V92 a6 6 0 0 1 6 -6 H160 a6 6 0 0 1 6 6 V104" />
      {/* scan sweep: gold */}
      <path d="M150 118 L86 62 M150 118 L156 44" stroke={GOLD} strokeDasharray="3 4" />
      <path d="M86 62 Q122 40 156 44" stroke={GOLD} />
      {/* phone */}
      <rect x="140" y="112" width="20" height="34" rx="4" fill={IVORY} />
      <path d="M146 141 H154" />
    </Frame>
  );
}

// A small house with a key hanging from the door: "list your home with us"
export function HouseKeys(props) {
  return (
    <Frame {...props}>
      <path d="M40 136 H200" />
      <path d="M70 136 V76 L120 36 L170 76 V136" fill={IVORY} />
      <path d="M58 86 L120 30 L182 86" />
      <path d="M108 136 V104 H132 V136" />
      <path d="M84 92 H100 V108 H84 Z M140 92 H156 V108 H140 Z" />
      {/* key on a ring: gold */}
      <circle cx="128" cy="122" r="2" stroke={GOLD} />
      <path d="M128 124 V140" stroke={GOLD} />
      <circle cx="128" cy="146" r="5" stroke={GOLD} />
      <path d="M128 132 H134 M128 136 H133" stroke={GOLD} />
    </Frame>
  );
}

// A magnifying glass over a folded map: "nothing matches these filters"
export function NoResults(props) {
  return (
    <Frame {...props}>
      <path d="M40 40 L90 28 L150 40 L200 28 V120 L150 132 L90 120 L40 132 Z" fill={IVORY} />
      <path d="M90 28 V120 M150 40 V132" />
      <path d="M58 104 C80 92 104 100 120 84 S170 70 184 58" strokeDasharray="2 5" />
      <circle cx="132" cy="78" r="22" fill={IVORY} />
      <path d="M148 94 L168 114" strokeWidth="3" />
      <path d="M124 78 H140" stroke={GOLD} />
    </Frame>
  );
}

// A folded map with one gold pin: "no nearby data / no location yet"
export function MapPin(props) {
  return (
    <Frame {...props}>
      <path d="M40 48 L90 36 L150 48 L200 36 V124 L150 136 L90 124 L40 136 Z" fill={IVORY} />
      <path d="M90 36 V124 M150 48 V136" />
      <path d="M50 96 C76 80 100 104 124 88 S168 76 190 66" strokeDasharray="2 5" />
      <path
        d="M120 92 C120 92 104 74 104 62 a16 16 0 0 1 32 0 C136 74 120 92 120 92 Z"
        stroke={GOLD}
        fill={IVORY}
      />
      <circle cx="120" cy="62" r="5" stroke={GOLD} />
    </Frame>
  );
}
