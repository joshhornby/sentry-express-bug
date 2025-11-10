# Sentry Express Lambda

Simple Express app running on AWS Lambda with Sentry monitoring.

## Setup

```bash
# Install dependencies
nvm use
npm install

# Set AWS account and region
export CDK_DEFAULT_ACCOUNT=your-account-id
export CDK_DEFAULT_REGION=us-east-1

# Deploy
npx cdk bootstrap  # first time only

# Deploy with Sentry DSN (choose one):
npm run deploy -- -c sentryDsn=your-dsn-here
# OR
export SENTRY_DSN=your-dsn-here
npm run deploy
```

## Test

```bash
curl https://your-api-url/debug-sentry
# Returns: OK
```

## Stack

- Node 22 Lambda
- Express with Sentry
- API Gateway HTTP API