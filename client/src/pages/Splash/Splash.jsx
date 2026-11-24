// Screen:    Splash
// URL:       ROUTES.SPLASH  ("/")
// Owner:     M2  (see docs/TEAM.md)
// Wireframe: 1 Splash
// Job:       App logo + loader while we check if the user is logged in, then redirect.
//
// Where it goes next: logged in -> Home (admins -> Admin). First visit -> Onboarding.
// Came back logged out -> Home (onboarding is only shown once).
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES } from "@realestate/shared";
import Logo from "../../components/Logo.jsx";
import { ROUTES } from "../../constants/routes.js";
import { useAuth } from "../../hooks/useAuth.jsx";
import { hasSeenOnboarding } from "../Onboarding/Onboarding.jsx";

// Long enough to see the logo, short enough not to annoy
const MIN_SPLASH_MS = 1100;

export default function Splash() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) return undefined;
    const timer = setTimeout(() => {
      let next = ROUTES.HOME;
      if (user?.role === ROLES.ADMIN) next = ROUTES.ADMIN;
      else if (!user && !hasSeenOnboarding()) next = ROUTES.ONBOARDING;
      navigate(next, { replace: true });
    }, MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [ready, user, navigate]);

  return (
    <main className="grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink text-white">
      <div className="absolute top-1/2 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40 blur-3xl" />
      <div className="relative flex animate-scale-in flex-col items-center">
        <Logo markOnly size={84} tone="light" />
        <h1 className="display mt-6 text-5xl">Aawas</h1>
        <p className="mt-2 text-sm tracking-[0.3em] text-accent uppercase">3D homes · Nepal</p>
      </div>
      <div className="relative mt-14 h-1 w-40 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/3 animate-[splash-bar_1.1s_ease-in-out_infinite] rounded-full bg-accent" />
      </div>
      <style>{`@keyframes splash-bar{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </main>
  );
}
