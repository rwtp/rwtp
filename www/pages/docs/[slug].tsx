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
import cn from 'classnames';
import { InformationPageHeader } from '../../components/Layout';
import { ChevronRightIcon } from '@heroicons/react/solid';
import Link from 'next/link';
import { useRouter } from 'next/router';

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

function SidebarItem(props: { children: any; slug: string }) {
  const router = useRouter();

  return (
    <Link href={`/docs/${props.slug}`}>
      <a
        className={cn({
          'flex px-2': true,
          'border-b py-2  border-t border-blue-500 border-l-2 bg-white':
            props.slug === router.query.slug,
          'text-gray-600 py-2 ': props.slug !== router.query.slug,
        })}
      >
        {props.children}
      </a>
    </Link>
  );
}

export default function PostPage({ source, frontMatter }: any) {
  return (
    <div className="h-full flex flex-col ">
      <div className="flex flex-col justify-between py-4 relative border-b bg-gray-50">
        <InformationPageHeader />
      </div>

      <div className="mx-auto border-b w-full px-4 text-gray-700">
        <div className="flex items-center py-4 font-mono">
          <a className="underline" href="/docs">
            Docs
          </a>
          <ChevronRightIcon className="h-4 w-4 mx-1 text-gray-400" />
          <div className="font-mono">{frontMatter.title}</div>
        </div>
      </div>
      <div className="flex flex-1">
        <div className="text-sm  hidden sm:flex bg-gray-50 border-r flex-col font-mono h-full">
          {/* <div className="text-xs px-2 pb-1 text-gray-500 py-4"># Basics</div> */}

          <SidebarItem slug={'whitepaper'}>Whitepaper</SidebarItem>
          <SidebarItem slug={'contracts'}>Contracts</SidebarItem>
          <SidebarItem slug={'metadata'}>Metadata</SidebarItem>
          <SidebarItem slug={'graphql'}>GraphQL</SidebarItem>
          <SidebarItem slug={'faq'}>FAQ</SidebarItem>
        </div>
        <article className="flex-1 px-4 text-gray-900  prose py-12 mx-auto prose-headings:font-serif prose-headings:font-medium ">
          <MDXRemote {...source} components={components} />
        </article>
      </div>
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
