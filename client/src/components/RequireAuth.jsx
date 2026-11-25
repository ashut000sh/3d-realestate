// Wrap a page that needs a logged-in user (optionally with a certain role).
// <RequireAuth><Chat /></RequireAuth>      <RequireAuth role="admin"><AdminDashboard /></RequireAuth>
// Logged out -> Login (and back here afterwards). Wrong role -> a friendly message.
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes.js";
import { useAuth } from "../hooks/useAuth.jsx";
import Button from "./Button.jsx";
import EmptyState from "./EmptyState.jsx";
import Loader from "./Loader.jsx";

export default function RequireAuth({ role, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <Loader fullScreen label="Checking your account..." />;
  if (!user) {
    return (
      <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname + location.search }} />
    );
  }
  if (role && user.role !== role) {
    return (
      <main className="page">
        <EmptyState
          icon="lock"
          title="This area isn't for your account"
          text={`You're logged in as a ${user.role}. This page is only for ${role}s.`}
          action={<Button to={ROUTES.HOME}>Back to home</Button>}
        />
      </main>
    );
  }
  return children;
}
