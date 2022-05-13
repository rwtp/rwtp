import fs from 'fs';
import path from 'path';

export function getAllPosts() {
  const categories = fs.readdirSync(path.join(process.cwd(), './_content'));

  let paths = [];
  for (let category of categories) {
    const inner = fs.readdirSync(
      path.join(process.cwd(), './_content', category)
    );

    for (let post of inner) {
      if (!post.endsWith('.mdx')) {
        throw new Error('Only .mdx files are supported. Please rename ' + post);
      }

      paths.push({
        params: {
          category: category,
          post: post.replace('.mdx', ''),
        },
      });
    }
  }

  return paths;
}
