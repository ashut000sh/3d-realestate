// Friendly "nothing here" / error message. Design v2: not boxed. A line-art illustration when
// one fits (assets/illustrations), else a quiet icon; a short title, one sentence, one action.
// <EmptyState illustration={NoResults} title="No homes match" text="Try fewer filters." action={<Button>..</Button>} />
// <EmptyState icon="alert" tone="danger" title="Couldn't load" text={error} />
import Icon from "./Icon.jsx";

export default function EmptyState({
  icon = "info",
  illustration: Illustration,
  title,
  text,
  action,
  tone = "neutral",
  className = "",
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={`flex animate-fade-in flex-col items-center px-4 py-12 text-center ${className}`}
    >
      {Illustration ? (
        <Illustration className="mb-6 w-56 max-w-full" />
      ) : (
        <Icon
          name={icon}
          className={`mb-4 h-7 w-7 ${tone === "danger" ? "text-danger" : "text-muted"}`}
        />
      )}
      {title && <h3 className="font-display text-heading text-ink">{title}</h3>}
      {text && <p className="mt-2 max-w-md text-body text-muted">{text}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
