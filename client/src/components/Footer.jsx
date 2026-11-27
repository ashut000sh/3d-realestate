// Site footer, shown on every page inside MainLayout.
// Quiet on purpose (design v2): ivory, a hairline on top, small type. The page is the star.
import { Link } from "react-router-dom";
import { DISTRICTS } from "@realestate/shared";
import { ROUTES } from "../constants/routes.js";
import Logo from "./Logo.jsx";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { to: `${ROUTES.SEARCH}?type=sale`, label: "Homes for sale" },
      { to: `${ROUTES.SEARCH}?type=rent`, label: "Homes for rent" },
      { to: `${ROUTES.SEARCH}?type=short_stay`, label: "Short stays" },
    ],
  },
  {
    title: "Districts",
    links: DISTRICTS.map((district) => ({
      to: `${ROUTES.SEARCH}?district=${district}`,
      label: district,
    })),
  },
  {
    title: "Sell with us",
    links: [
      { to: ROUTES.SCAN_REQUEST, label: "List your property" },
      { to: ROUTES.SIGNUP, label: "Create an account" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-[75rem] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-small text-muted">
            Homes across Nepal as true-to-scale 3D tours, scanned in person by our team.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="text-small font-semibold text-text">{column.title}</p>
            <ul className="mt-3 space-y-2 text-small text-muted">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mx-auto max-w-[75rem] px-4 pb-8 text-small text-muted sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Aawas · Final Year Project, Presidential Graduate School
      </p>
    </footer>
  );
}
