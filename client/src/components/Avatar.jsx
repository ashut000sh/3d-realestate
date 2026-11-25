// Round initials avatar. <Avatar name="Ram Thapa" size="md" />
const SIZES = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" };
const TONES = [
  "bg-primary-soft text-primary",
  "bg-accent-soft text-accent-dark",
  "bg-info-soft text-info",
  "bg-success-soft text-success",
];

export default function Avatar({ name = "", size = "md", className = "" }) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "?";
  // Same person -> same colour
  const tone = TONES[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TONES.length];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZES[size]} ${tone} ${className}`}
    >
      {initials}
    </span>
  );
}
