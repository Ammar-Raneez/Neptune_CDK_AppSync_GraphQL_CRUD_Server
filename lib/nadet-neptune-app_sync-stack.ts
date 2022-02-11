import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { DatabaseCluster, InstanceType } from '@aws-cdk/aws-neptune-alpha';
import { AuthorizationType, GraphqlApi, Schema } from '@aws-cdk/aws-appsync-alpha';
import { join } from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class NadetNeptuneAppSyncStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create VPC to have a connection between Neptune and lambda
    const vpc = new Vpc(this, 'NeptuneAppSyncVPC');

    // Create Neptune Cluster
    const cluster = new DatabaseCluster(this, 'NeptuneDBCluster', {
      instanceType: InstanceType.R5_LARGE,
      vpc,
      iamAuthentication: false,
    });

    // allow anyone in "vpc" to access
    cluster.connections.allowDefaultPortFromAnyIpv4('Open to everyone');

    // If iamAuthentication is used signed headers n roles will be needed
    // const role = new Role(this, 'NeptuneDBRole', {
    //   roleName: 'NeptuneDBRole',
    //   assumedBy: new ServicePrincipal('appsync.amazonaws.com')
    // });
    // const secondRole = new Role(this, 'NeptuneDBSecondRole', {
    //   roleName: 'NeptuneDBSecondRole',
    //   assumedBy: new AccountPrincipal(this.account)
    // });
    // role.addToPolicy(
    //   new PolicyStatement({
    //     resources: ['*'],
    //     actions: ['neptune:*', 'lambda:*', 'logs:*', 'cognito-idp:*'],
    //     effect: Effect.ALLOW,
    //   })
    // );
    // cluster.grantConnect(role);
    // cluster.grantConnect(secondRole);

    // get references to establish a websocket connection with lambda
    const writeAddress = cluster.clusterEndpoint.socketAddress;
    const readAddress = cluster.clusterReadEndpoint.socketAddress;


    // Create GraphQL Api, appsync datastore, resolvers etc...
    const api = new GraphqlApi(this, 'NeptuneGraphQLAPI', {
      name: 'NeptuneGraphQLAPI',
      schema: Schema.fromAsset('graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY
        }
      },
      xrayEnabled: true,
    });

    const lambdaFn = new NodejsFunction(this, 'NeptuneLambdaFn', {
      functionName: 'NeptuneLambdaFn',
      runtime: Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: join(__dirname, '..', 'lambdas', 'main.ts'),
      memorySize: 1024,
      environment: {
        WRITER: writeAddress,
        READER: readAddress
      },
      vpc,
    });

    const dataSource = api.addLambdaDataSource('NeptuneDataSource', lambdaFn, {
      name: 'NeptuneDataSource',
    });
    dataSource.createResolver({
      typeName: 'Query',
      fieldName: 'listPosts',
    });
    dataSource.createResolver({
      typeName: 'Mutation',
      fieldName: 'createPost',
    });


    new CfnOutput(this, 'NeptuneGraphQLAPIKeyOutput', {
      value: api.apiKey!,
      exportName: 'NeptuneGraphQLAPIKeyOutput'
    });
    new CfnOutput(this, 'NeptuneReadAddressOutput', {
      value: readAddress,
      exportName: 'NeptuneReadAddressOutput'
    });
    new CfnOutput(this, 'NeptuneWriteAddressOutput', {
      value: writeAddress,
      exportName: 'NeptuneWriteAddressOutput'
    });
  }
}
