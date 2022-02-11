import { driver, structure } from 'gremlin';

const DriverRemoteConnection = driver.DriverRemoteConnection;
const Graph = structure.Graph;
const uri = process.env.READER;

async function getPost(postId: string) {
  const driverConnector = new DriverRemoteConnection(`wss://${uri}/gremlin`, { });
  const graph = new Graph();
  const g = graph.traversal().withRemote(driverConnector);

  try {
    const properties = await g.V(postId).properties().toList();
    const post = properties.reduce((acc: any, next: any) => {
      acc[next.label] = next.value;     // attributes available in a property
      return acc;
    }, { });

    post.id = postId;
    return post;
  } catch (err) {
    console.log('ERROR', err);
    return null;
  }
}


export default getPost;
