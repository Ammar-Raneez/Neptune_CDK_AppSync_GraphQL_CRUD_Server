import createPost from './createPost';
import deletePost from './deletePost';
import getPost from './getPost';
import listPosts from './listPosts';
import { Post } from './Post';

type AppSyncEvent = {
  info: {
    fieldName: string
  },
  arguments: {
    postId: string,
    post: Post
  }
}

exports.handler = async (event: AppSyncEvent) => {
  switch (event.info.fieldName) {
    case 'createPost':
      return await createPost(event.arguments.post);
    case 'listPosts':
      return await listPosts();
    case 'getPost':
      return await getPost(event.arguments.postId);
    case 'deletePost':
      return await deletePost(event.arguments.postId);
    default:
      return null;
  }
}
