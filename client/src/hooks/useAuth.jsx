// Who is logged in, for every page. Owner: M2.
//
//   const { user, ready, login, logout, finishSignup } = useAuth();
//
// user  = the User object (docs/API.md) or null when logged out
// ready = false only while we check a saved token on first load (show a loader then)
//
// The token itself lives in services/api.js (tokenStore). This file only keeps the user.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { tokenStore } from "../services/api.js";
import * as authService from "../services/auth.service.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // With no saved token there is nothing to check, so we are ready straight away
  const [ready, setReady] = useState(() => !tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let cancelled = false;
    authService
      .getMe()
      .then((me) => !cancelled && setUser(me))
      .catch(() => {
        // Expired or invalid token: forget it
        if (!cancelled) tokenStore.clear();
      })
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const me = await authService.login(email, password);
    setUser(me);
    return me;
  }, []);

  // After signup the OTP screen verifies the code; that also logs the user in
  const finishSignup = useCallback(async (userId, otp) => {
    const me = await authService.verifyOtp(userId, otp);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, logout, finishSignup }),
    [user, ready, login, logout, finishSignup],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
