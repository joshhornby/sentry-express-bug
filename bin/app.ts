#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaStack } from '../lib/lambda-stack';

const app = new cdk.App();

new LambdaStack(app, 'SentryExpressLambdaStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Simple Express Lambda with Sentry monitoring on API Gateway',
});

app.synth();