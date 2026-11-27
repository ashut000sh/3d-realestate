// Who is waiting to enter an OTP: { userId, otpSentTo, next }.
// Signup and Login write it, the OTP screen reads it. Kept in sessionStorage so a page
// refresh on the OTP screen doesn't lose it (and it's gone when the tab closes).
const KEY = "aawas:pendingVerification";

export function savePendingVerification(value) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // storage blocked: the OTP screen falls back to router state
  }
}

export function readPendingVerification() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

export function clearPendingVerification() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
