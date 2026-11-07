/*
  Error reporting to GlitchTip (Sentry-compatible). Enabled only when
  SENTRY_DSN is set, so local development and tests stay quiet.
  Initialised from medusa-config.ts so it runs before anything else loads.
*/
let client: typeof import("@sentry/node") | null = null;

export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || client) return;
  const Sentry = require("@sentry/node") as typeof import("@sentry/node");
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
  client = Sentry;
};

/* 4xx are expected business errors; only server faults are worth an alert. */
export const captureServerError = (error: unknown, context: Record<string, unknown> = {}) => {
  if (!client) return;
  const status = (error as any)?.status ?? (error as any)?.statusCode;
  const type = (error as any)?.type as string | undefined;
  const expected =
    (typeof status === "number" && status < 500) ||
    ["not_found", "invalid_data", "not_allowed", "unauthorized", "duplicate_error", "conflict", "payment_authorization_error"].includes(type ?? "");
  if (expected) return;
  client.withScope((scope) => {
    scope.setContext("request", context);
    client!.captureException(error);
  });
};
