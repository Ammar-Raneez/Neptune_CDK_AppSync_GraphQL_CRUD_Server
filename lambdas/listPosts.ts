import { driver, structure } from 'gremlin';

const DriverRemoteConnection = driver.DriverRemoteConnection;
const Graph = structure.Graph;
const uri = process.env.READER;

const listPosts = async () => {
  const driverConnector = new DriverRemoteConnection(`wss://${uri}/gremlin`, { });
  const graph = new Graph();
  const g = graph.traversal().withRemote(driverConnector);

  try {
    const data = await g.V().hasLabel('Posts').toList();
    const posts: any = [];

    for (const vertex of data) {
      const properties = await g.V(vertex).properties().toList();
      console.log(properties)
      const post = properties.reduce((acc: any, next: any) => {
        acc[next.label] = next.value;
        return acc;
      }, { });

      post.id = (vertex as any).id;
      posts.push(post);
    }

    driverConnector.close();
    return posts;
  } catch (err) {
    console.log('ERROR', err);
    return null;
  }
}

export default listPosts;
