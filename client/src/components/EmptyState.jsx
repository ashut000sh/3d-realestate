// Friendly "nothing here" / error box.
// <EmptyState icon="search" title="No homes match" text="Try fewer filters." action={<Button>..</Button>} />
import Icon from "./Icon.jsx";

export default function EmptyState({
  icon = "info",
  title,
  text,
  action,
  tone = "neutral",
  className = "",
}) {
  const iconTone =
    tone === "danger" ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent-dark";
  return (
    <div
      className={`card flex flex-col items-center px-6 py-12 text-center animate-fade-in ${className}`}
    >
      <span className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${iconTone}`}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      {title && <h3 className="display text-xl text-ink">{title}</h3>}
      {text && <p className="mt-2 max-w-md text-muted">{text}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
