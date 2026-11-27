// Small coloured label. <Badge tone="success">Confirmed</Badge>
// Tones: neutral | primary | gold | success | warning | danger | info | dark
const TONES = {
  neutral: "bg-sand text-text",
  primary: "bg-primary-soft text-primary",
  gold: "bg-accent-soft text-accent-dark",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  dark: "bg-ink/90 text-white",
};

export default function Badge({ tone = "neutral", dot = false, className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
