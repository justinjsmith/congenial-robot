"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CongenialRobotStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const origins = __importStar(require("aws-cdk-lib/aws-cloudfront-origins"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const codebuild = __importStar(require("aws-cdk-lib/aws-codebuild"));
const codepipeline = __importStar(require("aws-cdk-lib/aws-codepipeline"));
const codepipeline_actions = __importStar(require("aws-cdk-lib/aws-codepipeline-actions"));
const s3deploy = __importStar(require("aws-cdk-lib/aws-s3-deployment"));
class CongenialRobotStack extends cdk.Stack {
    constructor(scope, id, props) {
        var _a;
        super(scope, id, props);
        const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            publicReadAccess: true,
            blockPublicAccess: new s3.BlockPublicAccess({
                blockPublicPolicy: false,
                blockPublicAcls: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false
            }),
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity');
        frontendBucket.grantRead(originAccessIdentity);
        const backendFunction = new lambda.Function(this, 'BackendFunction', {
            runtime: lambda.Runtime.PYTHON_3_12,
            handler: 'app.main.handler',
            code: lambda.Code.fromAsset('../backend'),
            environment: {},
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
        });
        const api = new apigateway.LambdaRestApi(this, 'BackendApi', {
            handler: backendFunction,
            proxy: true,
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
            },
        });
        const distribution = new cloudfront.Distribution(this, 'Distribution', {
            defaultBehavior: {
                origin: new origins.S3Origin(frontendBucket, {
                    originAccessIdentity,
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            additionalBehaviors: {
                '/api/*': {
                    origin: new origins.HttpOrigin(`${api.restApiId}.execute-api.${this.region}.amazonaws.com`, {
                        originPath: `/${api.deploymentStage.stageName}`,
                    }),
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                },
            },
            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                },
            ],
        });
        new s3deploy.BucketDeployment(this, 'DeployFrontend', {
            sources: [s3deploy.Source.asset('../frontend/dist')],
            destinationBucket: frontendBucket,
            distribution,
            distributionPaths: ['/*'],
        });
        const sourceOutput = new codepipeline.Artifact();
        const buildOutput = new codepipeline.Artifact();
        const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
                privileged: true,
            },
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install: {
                        'runtime-versions': {
                            nodejs: '16',
                            python: '3.12',
                        },
                        commands: [
                            'npm install -g aws-cdk',
                            'cd frontend && npm ci',
                            'cd ../backend && pip install poetry && poetry install',
                        ],
                    },
                    build: {
                        commands: [
                            'cd frontend && npm run build',
                            'cd ../backend && poetry build',
                            'cd ../cdk && npm ci && cdk deploy --require-approval never',
                        ],
                    },
                },
                artifacts: {
                    'base-directory': '.',
                    files: ['**/*'],
                },
            }),
        });
        (_a = buildProject.role) === null || _a === void 0 ? void 0 : _a.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));
        const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
            pipelineName: 'CongenialRobotPipeline',
            restartExecutionOnUpdate: true,
        });
        pipeline.addStage({
            stageName: 'Source',
            actions: [
                new codepipeline_actions.GitHubSourceAction({
                    actionName: 'GitHub_Source',
                    owner: 'justinjsmith',
                    repo: 'congenial-robot',
                    branch: 'main',
                    oauthToken: cdk.SecretValue.secretsManager('github-token'), // This will need to be created
                    output: sourceOutput,
                }),
            ],
        });
        pipeline.addStage({
            stageName: 'Build',
            actions: [
                new codepipeline_actions.CodeBuildAction({
                    actionName: 'Build',
                    project: buildProject,
                    input: sourceOutput,
                    outputs: [buildOutput],
                }),
            ],
        });
        new cdk.CfnOutput(this, 'DistributionDomainName', {
            value: distribution.distributionDomainName,
            description: 'The domain name of the CloudFront distribution',
        });
    }
}
exports.CongenialRobotStack = CongenialRobotStack;
