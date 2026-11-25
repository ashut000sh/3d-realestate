// The only place screens are wired to URLs. To add a screen:
// 1) add its path to constants/routes.js  2) create pages/<Name>/<Name>.jsx  3) add a <Route> here.
// Big screens are imported with lazy() so their code (Leaflet maps, three.js, Socket.IO)
// only downloads when someone opens them. The first page opens fast.
import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ROLES } from "@realestate/shared";
import Loader from "./components/Loader.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import { ROUTES } from "./constants/routes.js";
import MainLayout from "./layouts/MainLayout.jsx";
import Splash from "./pages/Splash/Splash.jsx";
import Onboarding from "./pages/Onboarding/Onboarding.jsx";
import Signup from "./pages/Signup/Signup.jsx";
import Login from "./pages/Login/Login.jsx";
import Otp from "./pages/Otp/Otp.jsx";
import Home from "./pages/Home/Home.jsx";
import NotFound from "./pages/NotFound/NotFound.jsx";

const Search = lazy(() => import("./pages/Search/Search.jsx"));
const Listing = lazy(() => import("./pages/Listing/Listing.jsx"));
const Tour = lazy(() => import("./pages/Tour/Tour.jsx"));
const Compare = lazy(() => import("./pages/Compare/Compare.jsx"));
const Booking = lazy(() => import("./pages/Booking/Booking.jsx"));
const Chat = lazy(() => import("./pages/Chat/Chat.jsx"));
const Saved = lazy(() => import("./pages/Saved/Saved.jsx"));
const MyBookings = lazy(() => import("./pages/MyBookings/MyBookings.jsx"));
const ScanRequest = lazy(() => import("./pages/ScanRequest/ScanRequest.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard/AdminDashboard.jsx"));

export default function App() {
  return (
    <Suspense fallback={<Loader fullScreen />}>
      <Routes>
        {/* Full-screen pages, no navbar */}
        <Route path={ROUTES.SPLASH} element={<Splash />} />
        <Route path={ROUTES.ONBOARDING} element={<Onboarding />} />
        <Route path={ROUTES.SIGNUP} element={<Signup />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.OTP} element={<Otp />} />
        <Route path={ROUTES.TOUR} element={<Tour />} />

        {/* Pages that show the navbar */}
        <Route element={<MainLayout />}>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.SEARCH} element={<Search />} />
          <Route path={ROUTES.LISTING} element={<Listing />} />
          <Route path={ROUTES.COMPARE} element={<Compare />} />
          <Route path={ROUTES.BOOKING} element={<Booking />} />
          <Route
            path={ROUTES.CHAT}
            element={
              <RequireAuth>
                <Chat />
              </RequireAuth>
            }
          />
          <Route
            path={ROUTES.MY_BOOKINGS}
            element={
              <RequireAuth>
                <MyBookings />
              </RequireAuth>
            }
          />
          <Route
            path={ROUTES.SAVED}
            element={
              <RequireAuth>
                <Saved />
              </RequireAuth>
            }
          />
          <Route
            path={ROUTES.SCAN_REQUEST}
            element={
              <RequireAuth role={ROLES.SELLER}>
                <ScanRequest />
              </RequireAuth>
            }
          />
          <Route
            path={ROUTES.ADMIN}
            element={
              <RequireAuth role={ROLES.ADMIN}>
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
