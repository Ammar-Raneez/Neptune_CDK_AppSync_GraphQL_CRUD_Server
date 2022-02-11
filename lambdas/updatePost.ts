import { driver, process as gremlinProcess, structure } from 'gremlin';

// Default cardinality of Neptune is "Set"
// This means that if you set a property value, it adds a new value to the property, but only if it doesn't already appear in the set of values
// To update a property value without adding an additional value to the set of values, specify single cardinality in the property step.
const { cardinality: { single } } = gremlinProcess;

const DriverRemoteConnection = driver.DriverRemoteConnection;
const Graph = structure.Graph;
const uri = process.env.WRITER;

async function updatePost(postId: string, post: any) {
  const driverConnector = new DriverRemoteConnection(`wss://${uri}/gremlin`, {});
  const graph = new Graph();
  const g = graph.traversal().withRemote(driverConnector);

  try {
    if (post.title && post.content) {
      await g.V(postId).property(single ,'title', post.title).property(single ,'content', post.content).next();
    } else if (post.title) {
      await g.V(postId).property(single ,'title', post.title).next();
    } else {
      await g.V(postId).property(single ,'content', post.content).next();
    }

    const properties = await g.V(postId).properties().toList();
    const updatedPost = properties.reduce((acc: any, next: any) => {
      acc[next.label] = next.value;
      return acc;
    }, { });

    updatedPost.id = postId;
    return updatedPost;
  } catch (err) {
    console.log('ERROR', err);
    return null;
  }
}

export default updatePost;
