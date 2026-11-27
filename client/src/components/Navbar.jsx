// Top navigation shown on every page inside MainLayout.
// Knows who is logged in (useAuth) and shows the right links for buyers, sellers and admins.
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ROLES } from "@realestate/shared";
import { ROUTES } from "../constants/routes.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { useSaved } from "../hooks/useSaved.js";
import { useUnreadCount } from "../hooks/useUnreadCount.js";
import { getCompareIds, onCompareChange } from "../pages/Compare/compareStore.js";
import Avatar from "./Avatar.jsx";
import Button from "./Button.jsx";
import Icon from "./Icon.jsx";
import Logo from "./Logo.jsx";

const LINKS = [
  { to: ROUTES.HOME, label: "Home", icon: "home" },
  { to: ROUTES.SEARCH, label: "Explore", icon: "search" },
  { to: ROUTES.COMPARE, label: "Compare", icon: "compare", showCount: true },
  { to: ROUTES.CHAT, label: "Messages", icon: "chat", showUnread: true },
];

// The logged-in user's own pages, for the account drop-down (laptop) and the phone menu.
// One list, so both menus always show the same pages.
function accountLinks(role) {
  return [
    role === ROLES.ADMIN && { to: ROUTES.ADMIN, label: "Admin dashboard", icon: "chart" },
    role === ROLES.SELLER && { to: ROUTES.MY_LISTINGS, label: "My listings", icon: "home" },
    role === ROLES.SELLER && { to: ROUTES.SCAN_REQUEST, label: "List a property", icon: "plus" },
    { to: ROUTES.MY_BOOKINGS, label: "My bookings", icon: "calendar" },
    { to: ROUTES.SAVED, label: "Saved homes", icon: "heart", count: "saved" },
  ].filter(Boolean);
}

// Small round number next to a link (compare count, unread messages)
function CountBubble({ value, tone = "accent" }) {
  if (!value) return null;
  const colours = tone === "danger" ? "bg-danger text-white" : "bg-accent text-ink";
  return (
    <span
      className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${colours}`}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

// Active page: ink text with a short gold underline (design v2: no filled pills in the nav)
const navClass = ({ isActive }) =>
  `relative flex h-16 items-center gap-1.5 px-3 text-small font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors ${
    isActive ? "text-ink after:bg-accent" : "text-muted after:bg-transparent hover:text-ink"
  }`;

function useCompareCount() {
  const [count, setCount] = useState(() => getCompareIds().length);
  useEffect(() => onCompareChange(() => setCount(getCompareIds().length)), []);
  return count;
}

function UserMenu({ user, onLogout, unread }) {
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
        className="flex h-10 items-center gap-2 rounded-full border border-border bg-surface py-1 pr-3 pl-1 transition-colors hover:border-muted/50"
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
          className="absolute right-0 mt-2 w-64 origin-top-right animate-scale-in rounded-xl border border-border bg-surface p-2 shadow-[var(--shadow-float)]"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar name={user.fullName} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.fullName}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>
          <p className="mx-3 mb-2 text-small text-muted capitalize">{user.role} account</p>
          <div className="my-1 h-px bg-border" />
          {accountLinks(user.role).map((link) => (
            <Link
              key={link.to}
              role="menuitem"
              to={link.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-sand"
            >
              <Icon name={link.icon} className="h-4 w-4 text-muted" /> {link.label}
              {link.count === "saved" && savedCount > 0 && (
                <span className="ml-auto rounded-full bg-sand px-2 text-xs font-semibold text-muted">
                  {savedCount}
                </span>
              )}
            </Link>
          ))}
          <Link
            role="menuitem"
            to={ROUTES.CHAT}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-sand"
          >
            <Icon name="chat" className="h-4 w-4 text-muted" /> Messages
            <span className="ml-auto">
              <CountBubble value={unread} tone="danger" />
            </span>
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
  const unread = useUnreadCount();
  const { count: savedCount } = useSaved();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate(ROUTES.HOME);
  }

  // A quiet text link: the only filled button in the bar is "Sign up" (one primary per area)
  const sellCta = (
    <Link
      to={user?.role === ROLES.ADMIN ? ROUTES.ADMIN : ROUTES.SCAN_REQUEST}
      className="px-2 text-small font-medium text-text transition-colors hover:text-primary"
    >
      {user?.role === ROLES.ADMIN ? "Dashboard" : "List your property"}
    </Link>
  );

  return (
    <header className="sticky top-0 z-[1000] border-b border-border bg-background">
      <nav className="mx-auto flex h-16 max-w-[75rem] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link to={ROUTES.HOME} className="mr-4" aria-label="Aawas home">
          <Logo />
        </Link>

        <div className="hidden items-center md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass} end={link.to === ROUTES.HOME}>
              {link.label}
              {link.showCount && <CountBubble value={compareCount} />}
              {link.showUnread && <CountBubble value={unread} tone="danger" />}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {sellCta}
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} unread={unread} />
          ) : (
            <>
              <Link
                to={ROUTES.LOGIN}
                className="px-2 text-small font-medium text-text transition-colors hover:text-primary"
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
          className="-mr-2 ml-auto flex h-11 w-11 items-center justify-center rounded-lg hover:bg-sand md:hidden"
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
            <div className="mb-3 flex items-center gap-3 border-b border-border px-3 pb-4">
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
                <span className="ml-auto">
                  {link.showCount && <CountBubble value={compareCount} />}
                  {link.showUnread && <CountBubble value={unread} tone="danger" />}
                </span>
              </NavLink>
            ))}
          </div>
          {user && (
            <>
              <p className="eyebrow mt-5 mb-1 px-3">Your account</p>
              <div className="grid gap-1">
                {accountLinks(user.role).map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-3 font-medium ${
                        isActive ? "bg-sand text-ink" : "text-text"
                      }`
                    }
                  >
                    <Icon name={link.icon} className="h-5 w-5 text-muted" />
                    {link.label}
                    {link.count === "saved" && (
                      <span className="ml-auto">
                        <CountBubble value={savedCount} />
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </>
          )}
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
