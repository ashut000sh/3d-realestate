// Shared button. Use this instead of styling <button> on every page.
// <Button>Save</Button>   <Button variant="secondary">Cancel</Button>
// <Button to="/search">Link that looks like a button</Button>   <Button loading>Saving</Button>
// Sizes: sm | md (default) | lg.  Variants: primary | secondary | ghost | gold | dark | danger
import { Link } from "react-router-dom";

const VARIANTS = {
  primary:
    "bg-primary text-white shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_8px_20px_-10px_rgb(29_91_76/0.7)] hover:bg-primary-dark",
  secondary: "bg-surface text-text border border-border hover:border-muted/40 hover:bg-sand/60",
  ghost: "text-text hover:bg-sand",
  gold: "bg-accent text-ink shadow-[0_8px_20px_-10px_rgb(195_154_75/0.9)] hover:bg-accent-dark hover:text-white",
  dark: "bg-ink text-white hover:bg-primary-dark",
  light: "bg-white text-ink hover:bg-accent-soft",
  danger: "bg-danger text-white hover:opacity-90",
};

const SIZES = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-[15px] gap-2 rounded-xl",
  lg: "h-13 px-7 text-base gap-2.5 rounded-xl",
};

export function buttonClass({ variant = "primary", size = "md", className = "" } = {}) {
  return `inline-flex items-center justify-center font-semibold whitespace-nowrap transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
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
