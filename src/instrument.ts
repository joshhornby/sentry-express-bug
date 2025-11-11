import * as Sentry from '@sentry/aws-serverless';

Sentry.init({
  debug: true,
  dsn: process.env.SENTRY_DSN,
  environment: 'staging',
  integrations: [
    Sentry.expressIntegration(),
    Sentry.httpIntegration()
  ],
  tracesSampleRate: 1.0,
});
