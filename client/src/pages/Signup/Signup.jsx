// Screen:    Signup
// URL:       ROUTES.SIGNUP  ("/signup")
// Owner:     M2  (see docs/TEAM.md)
// Wireframe: 3 Sign Up / Role
// Job:       Sign-up form + role picker (buyer, seller). Calls AUTH.SIGNUP, then goes to OTP.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROLES } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Icon from "../../components/Icon.jsx";
import Input from "../../components/Input.jsx";
import { ROUTES } from "../../constants/routes.js";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import { signup } from "../../services/auth.service.js";
import { savePendingVerification } from "../Otp/pendingVerification.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const ROLE_OPTIONS = [
  {
    role: ROLES.BUYER,
    title: "I'm looking",
    text: "Buy, rent or book a stay",
    icon: "search",
  },
  {
    role: ROLES.SELLER,
    title: "I'm listing",
    text: "Sell or rent out a property",
    icon: "home",
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 0-4 score for the strength bar. Same minimum as the server (8 characters).
function passwordScore(password) {
  if (!password) return 0;
  let score = password.length >= 8 ? 1 : 0;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}
const SCORE_LABEL = ["Too short", "Weak", "Fair", "Good", "Strong"];
const SCORE_COLOR = ["bg-danger", "bg-danger", "bg-warning", "bg-success", "bg-success"];

function validate(form) {
  const errors = {};
  if (form.fullName.trim().length < 2) errors.fullName = "Please enter your full name";
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address";
  if (form.phone && !/^\d{10}$/.test(form.phone)) errors.phone = "Phone must be 10 digits";
  if (form.password.length < 8) errors.password = "Use at least 8 characters";
  return errors;
}

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: ROLES.BUYER,
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const score = passwordScore(form.password);

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const result = await signup({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
      });
      const pending = { userId: result.userId, otpSentTo: result.otpSentTo };
      savePendingVerification(pending);
      navigate(ROUTES.OTP, { state: pending });
    } catch (err) {
      if (err.status === 409)
        setErrors({ email: "This email is already registered. Try logging in." });
      else setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  usePageTitle("Sign up");

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes a minute. We'll email you a code to confirm it's you."
      footer={
        <>
          Already have an account?{" "}
          <Link to={ROUTES.LOGIN} className="link">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Role picker */}
        <fieldset>
          <legend className="label">I want to</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLE_OPTIONS.map((option) => {
              const selected = form.role === option.role;
              return (
                <label
                  key={option.role}
                  className={`relative cursor-pointer rounded-2xl border p-4 transition ${
                    selected
                      ? "border-primary bg-primary-soft/60 ring-4 ring-primary/10"
                      : "border-border bg-surface hover:border-muted/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.role}
                    checked={selected}
                    onChange={set("role")}
                    className="sr-only"
                  />
                  <span
                    className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
                      selected ? "bg-primary text-white" : "bg-sand text-muted"
                    }`}
                  >
                    <Icon name={option.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="block font-semibold text-ink">{option.title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{option.text}</span>
                  {selected && (
                    <Icon
                      name="check"
                      className="absolute top-4 right-4 h-5 w-5 text-primary"
                      strokeWidth={2.5}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        <Input
          label="Full name"
          name="fullName"
          icon="user"
          autoComplete="name"
          placeholder="Sita Sharma"
          value={form.fullName}
          onChange={set("fullName")}
          error={errors.fullName}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          icon="mail"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
        />
        <Input
          label="Phone (optional)"
          name="phone"
          type="tel"
          icon="phone"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="98XXXXXXXX"
          maxLength={10}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
          error={errors.phone}
        />
        <div>
          <Input
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            icon="lock"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
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
          {form.password && (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-1.5 flex-1 rounded-full transition ${step <= score ? SCORE_COLOR[score] : "bg-border"}`}
                  />
                ))}
              </div>
              <span className="w-16 text-right text-xs font-medium text-muted">
                {SCORE_LABEL[score]}
              </span>
            </div>
          )}
        </div>

        {serverError && (
          <p className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            <Icon name="alert" className="h-4 w-4" /> {serverError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Create account
        </Button>
        <p className="text-center text-xs text-muted">
          By creating an account you agree to our terms and privacy policy.
        </p>
      </form>
    </AuthLayout>
  );
}
