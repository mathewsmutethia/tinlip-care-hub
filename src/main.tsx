import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";

// Error tracking — set VITE_SENTRY_DSN in Vercel env vars
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });
}

// User analytics — set VITE_POSTHOG_KEY in Vercel env vars
const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? "https://app.posthog.com",
    capture_pageview: true,
    loaded: (ph) => {
      if (import.meta.env.DEV) ph.debug();
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
