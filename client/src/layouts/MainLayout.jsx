// Wraps every page that should show the navbar. The page renders in <Outlet />.
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import Navbar from "../components/Navbar.jsx";

export default function MainLayout() {
  const { pathname } = useLocation();

  // New page -> start at the top (the browser keeps the old scroll position otherwise)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* key = path: each new page replays the short fade + 8px rise (none with reduced motion) */}
      <div key={pathname} className="page-enter flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
