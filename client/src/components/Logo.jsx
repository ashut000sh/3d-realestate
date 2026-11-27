// Aawas logo: a gold roof over a white house, then the word mark.
// <Logo />  <Logo tone="light" />  (light = for dark backgrounds)  <Logo markOnly size={56} />
export default function Logo({ tone = "dark", markOnly = false, size = 34, className = "" }) {
  const word = tone === "light" ? "text-white" : "text-ink";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill={tone === "light" ? "#ffffff1a" : "#0e2a23"} />
        <path
          d="M14 34 32 18l18 16"
          fill="none"
          stroke="#c39a4b"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 31v15h24V31"
          fill="none"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 46v-8h8v8"
          fill="none"
          stroke="#c39a4b"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
      {!markOnly && (
        <span className={`font-display text-[1.45rem] leading-none font-semibold ${word}`}>
          Aawas
        </span>
      )}
    </span>
  );
}
