#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib';
import { CongenialRobotStack } from '../lib/congenial-robot-stack';

const app = new cdk.App();
new CongenialRobotStack(app, 'CongenialRobotStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1' 
  },
});
