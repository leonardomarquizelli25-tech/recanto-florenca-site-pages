import * as Sentry from "@sentry/browser";

export function initObservability(dsn) {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: "production",
    sendDefaultPii: false,
    tracesSampleRate: 0.05,
  });
}
