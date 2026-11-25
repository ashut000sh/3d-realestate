// Every frontend URL lives here. Never type a path like "/login" anywhere else:
// use ROUTES.LOGIN, and for paths with :id use buildRoute(ROUTES.LISTING, { id }).
export const ROUTES = {
  SPLASH: "/",
  ONBOARDING: "/welcome",
  SIGNUP: "/signup",
  LOGIN: "/login",
  OTP: "/verify",
  HOME: "/home",
  SEARCH: "/search",
  LISTING: "/listings/:id",
  TOUR: "/listings/:id/tour",
  COMPARE: "/compare",
  BOOKING: "/listings/:id/book",
  CHAT: "/chat",
  SAVED: "/saved",
  MY_BOOKINGS: "/bookings",
  SCAN_REQUEST: "/sell/scan-request",
  MY_LISTINGS: "/sell/listings",
  ADMIN: "/admin",
  NOT_FOUND: "*",
};

export function buildRoute(pattern, params = {}) {
  return pattern.replace(/:(\w+)/g, (_, key) => encodeURIComponent(params[key]));
}
