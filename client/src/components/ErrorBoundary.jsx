// Safety net: if any screen crashes while drawing, show a friendly message with a way out
// instead of a blank white page. App.jsx gives it key={pathname}, so moving to another page
// starts fresh. The error itself goes to the browser console for whoever is debugging.
import { Component } from "react";
import { ROUTES } from "../constants/routes.js";
import Button from "./Button.jsx";
import EmptyState from "./EmptyState.jsx";

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Screen crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="page">
        <EmptyState
          icon="alert"
          tone="danger"
          title="Something went wrong on this page"
          text="It's not you. Reload to try again, or go back to the home page."
          action={
            <>
              <Button onClick={() => window.location.reload()}>Reload</Button>
              <Button to={ROUTES.HOME} variant="secondary">
                Home
              </Button>
            </>
          }
        />
      </main>
    );
  }
}
