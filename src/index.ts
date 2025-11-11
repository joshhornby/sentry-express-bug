import * as Sentry from '@sentry/aws-serverless';
import express from 'express';
import serverlessExpress from '@codegenie/serverless-express';
import {APIGatewayProxyEventV2WithRequestContext} from "aws-lambda";

const app = express();
app.get('/debug-sentry', (_req, res) => res.status(200).send('OK'));

app.use(Sentry.expressErrorHandler());

const serverlessExpressInstance = serverlessExpress({app});

exports.handler = Sentry.wrapHandler(async (event: APIGatewayProxyEventV2WithRequestContext<any>, context, callback) => {
    return serverlessExpressInstance(event, context, callback);
});
