// Every backend URL lives here. The SERVER registers routes with these strings
// and the CLIENT calls them with the same strings, so they can never disagree.
// For paths with :id use buildPath(API.LISTINGS.ONE, { id: 5 }).
// Request/response shapes for each one: docs/API.md
export const API = {
  AUTH: {
    SIGNUP: "/api/auth/signup",
    VERIFY_OTP: "/api/auth/verify-otp",
    RESEND_OTP: "/api/auth/resend-otp",
    LOGIN: "/api/auth/login",
    ME: "/api/auth/me",
  },
  LISTINGS: {
    LIST: "/api/listings",
    COMPARE: "/api/listings/compare",
    MINE: "/api/listings/mine",
    ONE: "/api/listings/:id",
    CREATE: "/api/listings",
    UPDATE: "/api/listings/:id",
    UPLOAD_IMAGES: "/api/listings/:id/images",
    NEARBY: "/api/listings/:id/nearby",
    AVAILABILITY: "/api/listings/:id/availability",
  },
  SCANS: {
    CREATE: "/api/scan-requests",
    MINE: "/api/scan-requests/mine",
    UPDATE_STATUS: "/api/scan-requests/:id/status",
    UPLOAD_TOUR: "/api/scan-requests/:id/tour",
  },
  BOOKINGS: {
    CREATE: "/api/bookings",
    MINE: "/api/bookings/mine",
    UPDATE_STATUS: "/api/bookings/:id/status",
  },
  CHAT: {
    CONVERSATIONS: "/api/chat/conversations",
    START: "/api/chat/conversations",
    MESSAGES: "/api/chat/conversations/:id/messages",
  },
  SAVED: {
    LIST: "/api/saved",
    IDS: "/api/saved/ids",
    ADD: "/api/saved",
    REMOVE: "/api/saved/:listingId",
  },
  ADMIN: {
    STATS: "/api/admin/stats",
    SCAN_QUEUE: "/api/admin/scan-requests",
    USERS: "/api/admin/users",
    INSIGHTS: "/api/admin/insights",
    BOOKINGS: "/api/admin/bookings",
  },
};

export function buildPath(pattern, params = {}) {
  return pattern.replace(/:(\w+)/g, (_, key) => encodeURIComponent(params[key]));
}
