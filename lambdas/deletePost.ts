import { driver, structure } from 'gremlin';

const DriverRemoteConnection = driver.DriverRemoteConnection;
const Graph = structure.Graph;
const uri = process.env.WRITER;

async function deletePost(postId: string) {
  const driverConnector = new DriverRemoteConnection(`wss://${uri}/gremlin`, {});
  const graph = new Graph();
  const g = graph.traversal().withRemote(driverConnector);

  try {
    await g.V(postId).drop().iterate();
    return postId;
  } catch (err) {
    console.log('ERROR', err);
    return null;
  }
}

export default deletePost;
