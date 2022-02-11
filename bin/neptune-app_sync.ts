#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NeptuneAppSyncStack } from '../lib/neptune-app_sync-stack';

const app = new cdk.App();
new NeptuneAppSyncStack(app, 'NeptuneAppSyncStack', {
  env: {
    region: 'eu-west-1',
  }
});