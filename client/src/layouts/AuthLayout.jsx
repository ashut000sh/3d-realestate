// Split screen for Login, Sign up and OTP: the form on the left, a brand panel on the right.
// <AuthLayout title="Welcome back" subtitle="Log in to continue">{form}</AuthLayout>
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Logo from "../components/Logo.jsx";
import { ROUTES } from "../constants/routes.js";

const POINTS = [
  { icon: "cube", text: "True-to-scale 3D tours of every live home" },
  { icon: "ruler", text: "Measure rooms right in your browser" },
  { icon: "shield", text: "Verified sellers, scanned by our own team" },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(0,0.95fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link to={ROUTES.HOME} aria-label="Aawas home" className="self-start">
          <Logo />
        </Link>
        <main className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-10">
          <div className="animate-fade-up">
            <h1 className="display text-[2.15rem] leading-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-muted">{footer}</div>}
          </div>
        </main>
        <p className="text-center text-xs text-muted">
          © {new Date().getFullYear()} Aawas · 3D homes in Nepal
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="grain absolute inset-0" />
        <div className="absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-primary/50 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        {/* Wireframe house, a nod to the 3D scans */}
        <svg
          viewBox="0 0 400 300"
          className="relative mx-auto mt-6 w-full max-w-md text-white/25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden="true"
        >
          <path
            d="M60 170 200 70l140 100"
            className="text-accent"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M90 150v110h220V150" />
          <path d="M90 260 40 290M310 260l50 30M40 290h320" />
          <path d="M170 260v-70h60v70" className="text-accent" stroke="currentColor" />
          <path d="M115 175h35v35h-35zM250 175h35v35h-35z" />
          <path d="M90 150 200 70l110 80M200 70v-30" strokeDasharray="4 6" />
          {[...Array(9)].map((_, i) => (
            <path key={i} d={`M${60 + i * 35} 290 ${90 + i * 27.5} 260`} strokeDasharray="2 5" />
          ))}
        </svg>

        <div className="relative">
          <p className="eyebrow text-accent">Aawas</p>
          <p className="display mt-3 max-w-md text-4xl leading-tight">
            Walk through your next home before you visit.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point) => (
              <li key={point.text} className="flex items-center gap-3 text-white/80">
                <span className="glass flex h-9 w-9 items-center justify-center rounded-xl">
                  <Icon name={point.icon} className="h-[18px] w-[18px] text-accent" />
                </span>
                {point.text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
