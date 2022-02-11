import { driver, structure } from 'gremlin';
import { Post } from './Post';

const DriverRemoteConnection = driver.DriverRemoteConnection;
const Graph = structure.Graph;
const uri = process.env.WRITER;

async function createPost(post: Post) {
  // establish a connection with a "server" that is hosting a TinkerPop-enabled graph
  // the "server" could be "Gremlin Server" or "Remote Gremlin Provider"  that exposes
  // protocols by which the gremlin package can connect to. This uses web sockets
  const driverConnector = new DriverRemoteConnection(`wss://${uri}/gremlin`, {});
  const graph = new Graph();
  const g = graph.traversal().withRemote(driverConnector);

  // Add a vertex called "Posts", that has title and content, to the graph
  const data = await g.addV('Posts')
    .property('title', post.title)
    .property('content', post.content)
    .next();

  post.id = data.value.id;
  driverConnector.close();
  return post;
}

export default createPost;

// TinkerPop is a graph computing framework for graph databases
// https://tinkerpop.apache.org/
// https://tinkerpop.apache.org/gremlin.html
// https://tinkerpop.apache.org/docs/current/reference/#gremlin-server
// https://tinkerpop.apache.org/docs/current/reference/#connecting-rgp
