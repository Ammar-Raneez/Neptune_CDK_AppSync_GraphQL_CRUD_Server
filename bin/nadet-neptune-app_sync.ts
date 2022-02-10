#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NadetNeptuneAppSyncStack } from '../lib/nadet-neptune-app_sync-stack';

const app = new cdk.App();
new NadetNeptuneAppSyncStack(app, 'NadetNeptuneAppSyncStack', {
  env: {
    region: 'eu-west-1',
  }
});