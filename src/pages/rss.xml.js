import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

// Single combined feed for the whole blog. `link` is a site-relative path;
// @astrojs/rss resolves it to an absolute URL against `context.site`.
export async function GET(context) {
  const posts = await getCollection('blog');
  return rss({
    title: 'SHUKE Labs Blog',
    description: 'Engineering writing from SHUKE Labs — each project tells its own story.',
    site: context.site,
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/blog/${post.id}`,
      })),
  });
}
