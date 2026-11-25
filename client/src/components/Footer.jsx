// Site footer, shown on every page inside MainLayout.
import { Link } from "react-router-dom";
import { DISTRICTS } from "@realestate/shared";
import { ROUTES } from "../constants/routes.js";
import Logo from "./Logo.jsx";

export default function Footer() {
  return (
    <footer className="grain mt-24 bg-ink text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Walk through homes across Nepal as true-to-scale 3D tours, before you ever step inside.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Explore</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to={`${ROUTES.SEARCH}?type=sale`} className="hover:text-white">
                Homes for sale
              </Link>
            </li>
            <li>
              <Link to={`${ROUTES.SEARCH}?type=rent`} className="hover:text-white">
                Homes for rent
              </Link>
            </li>
            <li>
              <Link to={`${ROUTES.SEARCH}?type=short_stay`} className="hover:text-white">
                Short stays
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Districts</p>
          <ul className="space-y-2 text-sm">
            {DISTRICTS.map((district) => (
              <li key={district}>
                <Link to={`${ROUTES.SEARCH}?district=${district}`} className="hover:text-white">
                  {district}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Sell with us</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to={ROUTES.SCAN_REQUEST} className="hover:text-white">
                List your property
              </Link>
            </li>
            <li>
              <Link to={ROUTES.SIGNUP} className="hover:text-white">
                Create an account
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/50 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Aawas · Final Year Project, Presidential Graduate School
        </p>
      </div>
    </footer>
  );
}
