// Screen:    Login
// URL:       ROUTES.LOGIN  ("/login")
// Owner:     M2  (see docs/TEAM.md)
// Wireframe: 3 Sign Up / Role
// Job:       Email + password. Calls AUTH.LOGIN, stores token, goes to Home.
//
// Not verified yet (403)? We send a fresh code and go to the OTP screen.
// Came here from a protected page? We go back there after logging in.
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ROLES } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Icon from "../../components/Icon.jsx";
import Input from "../../components/Input.jsx";
import { ROUTES } from "../../constants/routes.js";
import { useAuth } from "../../hooks/useAuth.jsx";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import { resendOtp } from "../../services/auth.service.js";
import { savePendingVerification } from "../Otp/pendingVerification.js";

// Seed accounts (npm run db:seed). Only shown while developing, never in a real build.
const DEMO_ACCOUNTS = [
  { label: "Buyer", email: "gita.buyer@test.com" },
  { label: "Seller", email: "ram.seller@test.com" },
  { label: "Admin", email: "admin@test.com" },
];
const DEMO_PASSWORD = "Password123!";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError("Enter your email and password");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const user = await login(form.email.trim(), form.password);
      const home = user.role === ROLES.ADMIN ? ROUTES.ADMIN : ROUTES.HOME;
      navigate(from ?? home, { replace: true });
    } catch (err) {
      if (err.status === 403 && err.data?.userId) {
        // Signed up but never entered the code: send a new one and verify now
        let otpSentTo = null;
        try {
          otpSentTo = (await resendOtp(err.data.userId)).otpSentTo;
        } catch {
          // 429 (asked too recently): the last code is still valid
        }
        const pending = { userId: err.data.userId, otpSentTo, next: from };
        savePendingVerification(pending);
        navigate(ROUTES.OTP, { state: pending });
        return;
      }
      setError(err.status === 401 ? "That email and password don't match" : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to save homes, chat with sellers and book visits."
      footer={
        <>
          New to Aawas?{" "}
          <Link to={ROUTES.SIGNUP} className="link">
            Create an account
          </Link>
        </>
      }
    >
      {from && (
        <p className="mb-6 flex items-center gap-2 rounded-xl bg-info-soft px-4 py-3 text-sm text-info">
          <Icon name="lock" className="h-4 w-4" /> Please log in to continue.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          icon="mail"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set("email")}
        />
        <Input
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          icon="lock"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={set("password")}
          right={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-sand hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <Icon name={showPassword ? "eyeOff" : "eye"} className="h-[18px] w-[18px]" />
            </button>
          }
        />

        {error && (
          <p
            className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
            role="alert"
          >
            <Icon name="alert" className="h-4 w-4" /> {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Log in
        </Button>
      </form>

      {import.meta.env.DEV && (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Demo accounts (development only)
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => setForm({ email: account.email, password: DEMO_PASSWORD })}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
