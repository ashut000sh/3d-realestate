// Screen:    Otp
// URL:       ROUTES.OTP  ("/verify")
// Owner:     M2  (see docs/TEAM.md)
// Wireframe: 3 Sign Up / Role
// Job:       6-digit OTP input + resend timer. Calls AUTH.VERIFY_OTP / AUTH.RESEND_OTP.
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LIMITS, ROLES } from "@realestate/shared";
import Button from "../../components/Button.jsx";
import Icon from "../../components/Icon.jsx";
import { ROUTES } from "../../constants/routes.js";
import { useAuth } from "../../hooks/useAuth.jsx";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import { resendOtp } from "../../services/auth.service.js";
import {
  clearPendingVerification,
  readPendingVerification,
  savePendingVerification,
} from "./pendingVerification.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

const LENGTH = LIMITS.OTP_LENGTH;
const emptyDigits = () => Array(LENGTH).fill("");

export default function Otp() {
  const { finishSignup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(() => location.state ?? readPendingVerification());

  const [digits, setDigits] = useState(emptyDigits);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);
  // Resend is allowed again at this time (ms). The first code was just sent.
  const [resendAt, setResendAt] = useState(() => Date.now() + LIMITS.OTP_RESEND_SECONDS * 1000);
  const [now, setNow] = useState(() => Date.now());
  const [resending, setResending] = useState(false);
  const [resentNote, setResentNote] = useState("");
  const inputs = useRef([]);

  // Tick once a second for the resend countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  usePageTitle("Verify your email");

  if (!pending?.userId) return <Navigate to={ROUTES.SIGNUP} replace />;

  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const code = digits.join("");

  async function verify(value) {
    setVerifying(true);
    setError("");
    try {
      const user = await finishSignup(pending.userId, value);
      clearPendingVerification();
      setDone(true);
      const home = user.role === ROLES.ADMIN ? ROUTES.ADMIN : ROUTES.HOME;
      setTimeout(() => navigate(pending.next ?? home, { replace: true }), 900);
    } catch (err) {
      setError(
        err.status === 409 ? "This account is already verified. Please log in." : err.message,
      );
      setDigits(emptyDigits());
      inputs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  function setDigitsAndMaybeSubmit(next) {
    setDigits(next);
    if (next.every(Boolean)) verify(next.join(""));
  }

  function handleChange(index, value) {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }
    // Typing or pasting several digits fills the following boxes too
    const next = [...digits];
    [...clean].slice(0, LENGTH - index).forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    const focusAt = Math.min(index + clean.length, LENGTH - 1);
    inputs.current[focusAt]?.focus();
    setDigitsAndMaybeSubmit(next);
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    setResentNote("");
    try {
      const { otpSentTo } = await resendOtp(pending.userId);
      const updated = { ...pending, otpSentTo };
      setPending(updated);
      savePendingVerification(updated);
      setResentNote("A new code is on its way.");
      setResendAt(Date.now() + LIMITS.OTP_RESEND_SECONDS * 1000);
      setDigits(emptyDigits());
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title={done ? "You're all set" : "Check your email"}
      subtitle={
        done ? (
          "Your account is verified. Taking you in..."
        ) : (
          <>
            We sent a {LENGTH}-digit code to{" "}
            <span className="font-semibold text-ink">{pending.otpSentTo ?? "your email"}</span>. It
            expires in {LIMITS.OTP_EXPIRY_MINUTES} minutes.
          </>
        )
      }
      footer={
        <>
          Wrong account?{" "}
          <Link to={ROUTES.SIGNUP} className="link" onClick={clearPendingVerification}>
            Start again
          </Link>
        </>
      }
    >
      {done ? (
        <div className="flex animate-scale-in flex-col items-center py-6">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success">
            <Icon name="check" className="h-10 w-10" strokeWidth={2.5} />
          </span>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (code.length === LENGTH) verify(code);
            else setError(`Enter all ${LENGTH} digits`);
          }}
          className="space-y-6"
        >
          <div
            className="flex justify-between gap-2 sm:gap-3"
            role="group"
            aria-label="Verification code"
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputs.current[index] = el)}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                autoFocus={index === 0}
                maxLength={LENGTH}
                aria-label={`Digit ${index + 1}`}
                disabled={verifying}
                className={`h-14 w-full min-w-0 rounded-xl border bg-surface text-center text-2xl font-semibold text-ink transition outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 sm:h-16 ${
                  error ? "border-danger" : digit ? "border-primary/50" : "border-border"
                }`}
              />
            ))}
          </div>

          {error && (
            <p
              className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
              role="alert"
            >
              <Icon name="alert" className="h-4 w-4" /> {error}
            </p>
          )}
          {resentNote && !error && (
            <p className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
              <Icon name="check" className="h-4 w-4" /> {resentNote}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={verifying}>
            Verify and continue
          </Button>

          <p className="text-center text-sm text-muted">
            Didn't get it?{" "}
            {secondsLeft > 0 ? (
              <span>
                Resend in{" "}
                <span className="font-semibold text-ink tabular-nums">
                  0:{String(secondsLeft).padStart(2, "0")}
                </span>
              </span>
            ) : (
              <button type="button" onClick={handleResend} disabled={resending} className="link">
                {resending ? "Sending..." : "Resend code"}
              </button>
            )}
          </p>
          {import.meta.env.DEV && (
            <p className="text-center text-xs text-muted">
              Developing locally? The code is printed in the server terminal.
            </p>
          )}
        </form>
      )}
    </AuthLayout>
  );
}
