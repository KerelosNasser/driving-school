// This file configures the initialization of Sentry for the Edge Runtime.
// The config you add here will be used whenever an API route, Server Component, Route Handler, Middleware, or Edge Route Handler is deployed to the Edge Runtime.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  debug: false,
});