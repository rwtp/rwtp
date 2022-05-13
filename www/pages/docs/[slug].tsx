import fs from 'fs';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import Head from 'next/head';
import path from 'path';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkPrism from 'remark-prism';

import { InformationPageHeader } from '../../components/Layout';

const CONTENT_PATH = path.join(process.cwd(), '_docs');

// Custom components/renderers to pass to MDX.
// Since the MDX files aren't loaded by webpack, they have no knowledge of how
// to handle import statements. Instead, you must include components in scope
// here.
const components = {
  //   a: CustomLink,
  // It also works with dynamically-imported components, which is especially
  // useful for conditionally loading components for certain routes.
  // See the notes in README.md for more details.
  //   TestComponent: dynamic(() => import("../../components/TestComponent")),
  Head,
};

export default function PostPage({ source, frontMatter }: any) {
  return (
    <div className="max-w-6xl mx-auto w-full pb-12 relative flex flex-col">
      <div className="flex flex-col justify-between pt-4 relative">
        <InformationPageHeader />
      </div>

      <article className="px-4 text-gray-900  prose pt-12 mx-auto prose-headings:font-serif prose-headings:font-medium">
        <MDXRemote {...source} components={components} />
      </article>
    </div>
  );
}

export const getStaticProps = async ({ params }: any) => {
  const postFilePath = path.join(CONTENT_PATH, `${params.slug}.mdx`);
  const source = fs.readFileSync(postFilePath);

  const { content, data } = matter(source);

  const mdxSource = await serialize(content, {
    // Optionally pass remark/rehype plugins
    mdxOptions: {
      remarkPlugins: [remarkMath, remarkPrism as any],
      rehypePlugins: [rehypeKatex],
    },
    scope: data,
  });

  return {
    props: {
      source: mdxSource,
      frontMatter: data,
    },
  };
};

export const getStaticPaths = async () => {
  // Filter for mdx files in the content folder
  const contentFiles = fs
    .readdirSync(CONTENT_PATH)
    // Only include md(x) files
    .filter((path) => /\.mdx?$/.test(path));

  // Convert the filenames to paths that nextjs understands
  const paths = contentFiles
    // Remove file extensions for page paths
    .map((path: any) => path.replace(/\.mdx?$/, ''))
    // Map the path into the static paths object required by Next.js
    .map((slug: any) => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};
