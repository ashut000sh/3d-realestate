// Screen:    NotFound
// URL:       ROUTES.NOT_FOUND  ("*")
// Owner:     M2  (see docs/TEAM.md)
// Wireframe: -
// Job:       404 page with a link back home.
import Button from "../../components/Button.jsx";
import Icon from "../../components/Icon.jsx";
import { ROUTES } from "../../constants/routes.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";

export default function NotFound() {
  usePageTitle("Page not found");

  return (
    <main className="page flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="relative animate-fade-up">
        <p className="display bg-gradient-to-b from-primary to-ink bg-clip-text text-[9rem] leading-none text-transparent sm:text-[12rem]">
          404
        </p>
        <span className="absolute -top-2 -right-6 flex h-14 w-14 rotate-12 items-center justify-center rounded-2xl bg-accent text-ink shadow-[var(--shadow-lift)]">
          <Icon name="pin" className="h-7 w-7" />
        </span>
      </div>
      <h1 className="display mt-4 text-3xl text-ink">This address doesn't exist</h1>
      <p className="mt-3 max-w-md text-muted">
        The page may have moved, or the link is mistyped. Let's get you back to homes that do.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to={ROUTES.HOME}>
          <Icon name="home" className="h-4 w-4" /> Back to home
        </Button>
        <Button to={ROUTES.SEARCH} variant="secondary">
          <Icon name="search" className="h-4 w-4" /> Explore homes
        </Button>
      </div>
    </main>
  );
}
