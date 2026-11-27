// Shared loading states.
// <Loader label="Loading listings..." />       spinner with text
// <Loader fullScreen />                          centred on the whole screen
// <Skeleton className="h-40" />                  grey shimmering block while content loads
export default function Loader({ label = "Loading...", fullScreen = false }) {
  const spinner = (
    <div role="status" className="flex items-center gap-3 text-sm text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
      {label}
    </div>
  );
  if (!fullScreen) return spinner;
  return <div className="flex min-h-[50vh] items-center justify-center">{spinner}</div>;
}

export function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}
