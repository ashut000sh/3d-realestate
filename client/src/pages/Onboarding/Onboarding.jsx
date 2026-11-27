// Screen:    Onboarding
// URL:       ROUTES.ONBOARDING  ("/welcome")
// Owner:     M2  (see docs/TEAM.md)
// Wireframe: 2 Onboarding
// Job:       2-3 intro slides explaining 3D tours, then Sign up / Log in buttons.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button.jsx";
import Icon from "../../components/Icon.jsx";
import Logo from "../../components/Logo.jsx";
import { ROUTES } from "../../constants/routes.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

// Remember that onboarding was shown, so Splash skips it next time
const SEEN_KEY = "aawas:onboarded";
export function hasSeenOnboarding() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // private mode: onboarding just shows again next time
  }
}

const SLIDES = [
  {
    eyebrow: "Step inside",
    title: "Walk through homes before you visit",
    text: "Every live listing on Aawas can be explored as an interactive 3D tour, captured on site with LiDAR.",
    icon: "cube",
  },
  {
    eyebrow: "Know the space",
    title: "Measure any room from your sofa",
    text: "Tap two points in the tour to measure walls, doors and ceilings. No more guessing if the sofa fits.",
    icon: "ruler",
  },
  {
    eyebrow: "Decide faster",
    title: "Compare, chat and book in one place",
    text: "Shortlist up to three homes side by side, message the seller and book a viewing or a stay.",
    icon: "compare",
  },
];

// One decorative illustration per slide
function Illustration({ index }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm">
      <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary to-ink shadow-[var(--shadow-lift)]" />
      <div className="grain absolute inset-6 rounded-[2.5rem]" />
      <svg
        viewBox="0 0 300 300"
        className="absolute inset-6 h-[calc(100%-3rem)] w-[calc(100%-3rem)]"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {index === 0 && (
          <g strokeWidth="2">
            <path d="M70 140 150 80l80 60" stroke="#c39a4b" strokeWidth="3" />
            <path d="M90 128v92h120v-92" stroke="#fff" />
            <path d="M135 220v-45h30v45" stroke="#c39a4b" />
            <path d="M90 220 60 240h180l-30-20" stroke="#ffffff55" />
            <path d="M150 80V50M150 50l-12 8m12-8 12 8" stroke="#ffffff88" />
            <circle cx="150" cy="150" r="96" stroke="#ffffff22" strokeDasharray="3 7" />
          </g>
        )}
        {index === 1 && (
          <g strokeWidth="2">
            <path d="M60 210h180M60 90h180M60 90v120M240 90v120" stroke="#ffffff55" />
            <path d="M80 190 220 110" stroke="#c39a4b" strokeWidth="3" strokeDasharray="7 6" />
            <circle cx="80" cy="190" r="8" fill="#c39a4b" />
            <circle cx="220" cy="110" r="8" fill="#c39a4b" />
            <rect x="112" y="128" width="76" height="30" rx="15" fill="#fff" />
            <text x="150" y="148" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0e2a23">
              4.82 m
            </text>
          </g>
        )}
        {index === 2 && (
          <g strokeWidth="2">
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${48 + i * 72} ${78 + (i === 1 ? -14 : 0)})`}>
                <rect width="60" height="130" rx="12" fill={i === 1 ? "#fff" : "#ffffff22"} />
                <rect
                  x="8"
                  y="8"
                  width="44"
                  height="34"
                  rx="6"
                  fill={i === 1 ? "#e6efe9" : "#ffffff22"}
                />
                {[54, 70, 86, 102].map((y) => (
                  <rect
                    key={y}
                    x="8"
                    y={y}
                    width={y === 54 ? 30 : 44}
                    height="6"
                    rx="3"
                    fill={i === 1 ? "#c39a4b" : "#ffffff44"}
                  />
                ))}
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  function go(to) {
    markSeen();
    navigate(to);
  }

  usePageTitle("Welcome");

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <button
          onClick={() => go(ROUTES.HOME)}
          className="text-sm font-semibold text-muted hover:text-ink"
        >
          Skip
        </button>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 pb-10 sm:px-8 lg:grid-cols-2">
        <div key={index} className="order-2 animate-fade-up lg:order-1">
          <p className="eyebrow">
            {String(index + 1).padStart(2, "0")} · {slide.eyebrow}
          </p>
          <h1 className="display mt-4 text-4xl leading-[1.1] text-ink sm:text-5xl">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">{slide.text}</p>

          {/* Dots */}
          <div className="mt-10 flex items-center gap-2" role="tablist" aria-label="Slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.title}
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  i === index ? "w-10 bg-primary" : "w-2 bg-border hover:bg-muted/40"
                }`}
              />
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {isLast ? (
              <>
                <Button size="lg" onClick={() => go(ROUTES.SIGNUP)}>
                  Create an account <Icon name="arrowRight" className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="secondary" onClick={() => go(ROUTES.LOGIN)}>
                  I have an account
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => setIndex(index + 1)}>
                  Next <Icon name="arrowRight" className="h-4 w-4" />
                </Button>
                {index > 0 && (
                  <Button size="lg" variant="ghost" onClick={() => setIndex(index - 1)}>
                    Back
                  </Button>
                )}
              </>
            )}
          </div>
          {isLast && (
            <p className="mt-6 text-sm text-muted">
              Just looking?{" "}
              <Link to={ROUTES.HOME} onClick={markSeen} className="link">
                Browse homes as a guest
              </Link>
            </p>
          )}
        </div>

        <div key={`art-${index}`} className="order-1 animate-scale-in lg:order-2">
          <Illustration index={index} />
        </div>
      </section>
    </main>
  );
}
