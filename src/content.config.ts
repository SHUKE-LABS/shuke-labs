import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tagline: z.string().optional(),
    // Homepage ordering + grouping.
    weight: z.number(),
    group: z.enum(['dev', 'app']),
    // Non-fully-public products carry a status badge on their card.
    commercial: z.boolean().default(false),
    // Icons: one of an emoji glyph or an SVG in /images.
    icon_emoji: z.string().optional(),
    icon_image: z.string().optional(),
    github: z.string().url().optional(),
    free: z.boolean().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    lang: z.enum(['en', 'zh']).default('en'),
    tags: z.array(z.string()).default([]),
    // Byline. Agents are permitted (the AI-team is authored by its agents);
    // unset falls back to the org byline "SHUKE Labs" at render time.
    author: z.string().optional(),
    // Which project this post belongs to (slug). Optional: meta / blog-level
    // posts (e.g. the opening manifesto) omit it. Hierarchy: project → series → order.
    project: z.string().optional(),
    // Ordered sequences within a project (e.g. the thesis series); both optional.
    series: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { products, blog };
