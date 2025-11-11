import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction, OutputFormat} from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sentryDsn = this.node.tryGetContext('sentryDsn') || process.env.SENTRY_DSN || '';

    const logGroup = new logs.LogGroup(this, 'SentryExpressLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const sentryLambda = new NodejsFunction(this, 'SentryExpressLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../src/index.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logGroup,
      environment: {
        SENTRY_DSN: sentryDsn,
        NODE_ENV: 'staging',
        NODE_OPTIONS: '--import ./instrument.js',
      },
      bundling: {
        format: OutputFormat.CJS,
        target: 'es2022',
        sourceMap: true,
        platform: 'linux/amd64',
        forceDockerBundling: true,
        nodeModules: [
          '@sentry/aws-serverless',
          'express',
          '@codegenie/serverless-express'
        ],
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [
              `cp ${inputDir}/src/instrument.ts ${outputDir}/instrument.ts`,
              `cd ${outputDir} && npx esbuild instrument.ts --outfile=instrument.js --platform=node --target=es2022 --format=cjs`,
              `rm ${outputDir}/instrument.ts`
            ];
          },
          beforeInstall(inputDir: string, outputDir: string): string[] {
            return [];
          },
        },
      },
    });

    logGroup.grantWrite(sentryLambda);

    sentryLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: [`arn:aws:logs:${this.region}:${this.account}:*`],
    }));

    const httpApi = new apigateway.HttpApi(this, 'SentryExpressApi', {
      description: 'Simple Express Lambda with Sentry',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigateway.CorsHttpMethod.GET, apigateway.CorsHttpMethod.POST],
        allowHeaders: ['Content-Type'],
      },
    });

    const lambdaIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'LambdaIntegration',
      sentryLambda
    );

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigateway.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.url ?? 'No URL',
      description: 'API Gateway endpoint URL',
    });
  }
}
