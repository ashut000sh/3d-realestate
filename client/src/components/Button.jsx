// Shared button. Use this instead of styling <button> on every page.
// <Button>Save</Button>   <Button variant="secondary">Cancel</Button>
// <Button to="/search">Link that looks like a button</Button>   <Button loading>Saving</Button>
// Sizes: sm | md (default) | lg.  Variants: primary | secondary | ghost | gold | dark | danger
// Design v2 (docs/design/SYSTEM.md): one green primary per area, no coloured shadows.
// "gold" is retired as a fill and now looks like `secondary` (kept so old call sites still work).
import { Link } from "react-router-dom";

const SECONDARY =
  "bg-surface text-text border border-border hover:border-muted/50 hover:bg-sand/50";
const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary: SECONDARY,
  ghost: "text-text hover:bg-sand/70",
  gold: SECONDARY,
  dark: "bg-ink text-white hover:bg-primary-dark",
  light: "bg-white text-ink hover:bg-sand",
  danger: "bg-danger text-white hover:opacity-90",
};

// 44px is the minimum comfortable tap target; sm (40px) is for dense desktop rows
const SIZES = {
  sm: "h-10 px-3.5 text-small gap-1.5 rounded-lg",
  md: "h-11 px-5 text-small gap-2 rounded-lg",
  lg: "h-12 px-6 text-body gap-2 rounded-lg",
};

export function buttonClass({ variant = "primary", size = "md", className = "" } = {}) {
  return `inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  to,
  children,
  disabled,
  ...props
}) {
  const classes = buttonClass({ variant, size, className });
  const content = (
    <>
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
