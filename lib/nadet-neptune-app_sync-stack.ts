import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import {
  CfnApiKey,
  CfnDataSource,
  CfnGraphQLApi,
  CfnGraphQLSchema,
  CfnResolver
} from 'aws-cdk-lib/aws-appsync';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Code, Function as Lambda, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { DatabaseCluster, InstanceType } from '@aws-cdk/aws-neptune-alpha';

export class NadetNeptuneAppSyncStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create VPC to have a connection between Neptune and lambda
    const vpc = new Vpc(this, 'NeptuneAppSyncVPC');




    // Create GraphQL Api, appsync datastore, resolvers etc...
    const api = new CfnGraphQLApi(this, 'NeptuneGraphQLAPI', {
      name: 'NeptuneGraphQLAPI',
      authenticationType: 'API_KEY',
      xrayEnabled: true,
    });

    const schema = new CfnGraphQLSchema(this, 'NeptuneGraphQLSchema', {
      apiId: api.attrApiId,
      definition: `
        type Post {
          id: ID!
          title: String!
          content: String!
        }

        input PostInput {
          title: String!
          content: String!
        }

        type Query {
          listPosts: [Post]
        }

        type Mutation {
          createPost(post: PostInput!): Post
        }

        type Subscription {
          onCreatePost: Post
          @aws_subscribe(mutations: ["createPost"])
        }
      `
    });

    const apiKey = new CfnApiKey(this, 'NeptuneGraphQLAPIkey', {
      apiId: api.attrApiId,
    });

    const lambdaFn = new Lambda(this, 'NeptuneLambdaFn', {
      functionName: 'NeptuneLambdaFn',
      runtime: Runtime.NODEJS_14_X,
      handler: 'main.handler',
      code: Code.fromAsset('lambda-fns'),
      memorySize: 1024,
      environment: {
        WRITER: writeAddress,
        READER: readAddress
      },
      vpc
    });

    const datasource = new CfnDataSource(this, 'NeptuneAppSyncDatasource', {
      name: 'NeptuneAppSyncDatasource',
      apiId: api.attrApiId,
      type: 'AWS_LAMBDA',
      lambdaConfig: {
        lambdaFunctionArn: lambdaFn.functionArn
      }
    });

    new CfnResolver(this, 'NeptuneQueryResolver', {
      apiId: api.attrApiId,
      typeName: 'Query',
      fieldName: 'listPosts',
      dataSourceName: datasource.name
    }).addDependsOn(schema);
    new CfnResolver(this, 'NeptuneMutationResolver', {
      apiId: api.attrApiId,
      typeName: 'Mutation',
      fieldName: 'createPost',
      dataSourceName: datasource.name
    }).addDependsOn(schema);


    new CfnOutput(this, 'NeptuneGraphQLAPIkey', {
      value: apiKey.attrApiKey,
      exportName: 'NeptuneGraphQLAPIkey'
    });
    new CfnOutput(this, 'NeptuneReadAddress', {
      value: readAddress,
      exportName: 'NeptuneReadAddress'
    });
    new CfnOutput(this, 'NeptuneWriteAddress', {
      value: writeAddress,
      exportName: 'NeptuneWriteAddress'
    });
  }
}
