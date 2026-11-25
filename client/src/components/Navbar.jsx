// Top navigation shown on every page inside MainLayout.
// Knows who is logged in (useAuth) and shows the right links for buyers, sellers and admins.
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ROLES } from "@realestate/shared";
import { ROUTES } from "../constants/routes.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { useSaved } from "../hooks/useSaved.js";
import { getCompareIds, onCompareChange } from "../pages/Compare/compareStore.js";
import Avatar from "./Avatar.jsx";
import Button from "./Button.jsx";
import Icon from "./Icon.jsx";
import Logo from "./Logo.jsx";

const LINKS = [
  { to: ROUTES.HOME, label: "Home", icon: "home" },
  { to: ROUTES.SEARCH, label: "Explore", icon: "search" },
  { to: ROUTES.COMPARE, label: "Compare", icon: "compare", showCount: true },
  { to: ROUTES.CHAT, label: "Messages", icon: "chat" },
];

const navClass = ({ isActive }) =>
  `relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "text-ink bg-sand" : "text-muted hover:text-ink hover:bg-sand/60"
  }`;

function useCompareCount() {
  const [count, setCount] = useState(() => getCompareIds().length);
  useEffect(() => onCompareChange(() => setCount(getCompareIds().length)), []);
  return count;
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const { count: savedCount } = useSaved();
  const ref = useRef(null);

  // Close when clicking anywhere else
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => !ref.current?.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pr-3 pl-1 transition hover:shadow-[var(--shadow-soft)]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar name={user.fullName} size="sm" />
        <span className="hidden max-w-28 truncate text-sm font-medium lg:block">
          {user.fullName.split(" ")[0]}
        </span>
        <Icon name="chevronDown" className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 origin-top-right animate-scale-in rounded-2xl border border-border bg-surface p-2 shadow-[var(--shadow-lift)]"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar name={user.fullName} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.fullName}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>
          <p className="mx-3 mb-2 inline-flex rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-dark capitalize">
            {user.role} account
          </p>
          <div className="my-1 h-px bg-border" />
          {user.role === ROLES.SELLER && (
            <Link
              role="menuitem"
              to={ROUTES.SCAN_REQUEST}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-sand"
            >
              <Icon name="grid" className="h-4 w-4 text-muted" /> My properties
            </Link>
          )}
          {user.role === ROLES.ADMIN && (
            <Link
              role="menuitem"
              to={ROUTES.ADMIN}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-sand"
            >
              <Icon name="chart" className="h-4 w-4 text-muted" /> Admin dashboard
            </Link>
          )}
          <Link
            role="menuitem"
            to={ROUTES.MY_BOOKINGS}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-sand"
          >
            <Icon name="calendar" className="h-4 w-4 text-muted" /> My bookings
          </Link>
          <Link
            role="menuitem"
            to={ROUTES.SAVED}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-sand"
          >
            <Icon name="heart" className="h-4 w-4 text-muted" /> Saved homes
            {savedCount > 0 && (
              <span className="ml-auto rounded-full bg-sand px-2 text-xs font-semibold text-muted">
                {savedCount}
              </span>
            )}
          </Link>
          <Link
            role="menuitem"
            to={ROUTES.CHAT}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-sand"
          >
            <Icon name="chat" className="h-4 w-4 text-muted" /> Messages
          </Link>
          <button
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
          >
            <Icon name="logout" className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const compareCount = useCompareCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate(ROUTES.HOME);
  }

  const sellCta =
    user?.role === ROLES.ADMIN ? (
      <Button to={ROUTES.ADMIN} variant="dark" size="sm">
        <Icon name="chart" className="h-4 w-4" /> Dashboard
      </Button>
    ) : (
      <Button to={ROUTES.SCAN_REQUEST} variant="dark" size="sm">
        <Icon name="plus" className="h-4 w-4" /> List your property
      </Button>
    );

  return (
    <header className="sticky top-0 z-[1000] border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link to={ROUTES.HOME} className="mr-4" aria-label="Aawas home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass} end={link.to === ROUTES.HOME}>
              {link.label}
              {link.showCount && compareCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-ink">
                  {compareCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {sellCta}
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <>
              <Link
                to={ROUTES.LOGIN}
                className="px-2 text-sm font-semibold text-ink hover:text-primary"
              >
                Log in
              </Link>
              <Button to={ROUTES.SIGNUP} size="sm">
                Sign up
              </Button>
            </>
          )}
        </div>

        <button
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl hover:bg-sand md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <Icon name={mobileOpen ? "x" : "menu"} className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-fade-in border-t border-border bg-background px-4 pt-3 pb-6 md:hidden">
          {user && (
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-surface p-3">
              <Avatar name={user.fullName} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.fullName}</p>
                <p className="text-sm text-muted capitalize">{user.role} account</p>
              </div>
            </div>
          )}
          <div className="grid gap-1">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === ROUTES.HOME}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 font-medium ${
                    isActive ? "bg-sand text-ink" : "text-text"
                  }`
                }
              >
                <Icon name={link.icon} className="h-5 w-5 text-muted" />
                {link.label}
                {link.showCount && compareCount > 0 && (
                  <span className="ml-auto rounded-full bg-accent px-2 text-xs font-bold text-ink">
                    {compareCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
          <div className="mt-4 grid gap-2" onClick={() => setMobileOpen(false)}>
            {sellCta}
            {user ? (
              <Button variant="secondary" onClick={handleLogout}>
                <Icon name="logout" className="h-4 w-4" /> Log out
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button to={ROUTES.LOGIN} variant="secondary">
                  Log in
                </Button>
                <Button to={ROUTES.SIGNUP}>Sign up</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
