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
    // Chinese companion of this (English) post: a blog slug or an absolute URL.
    // When set, the post renders a [中文版] link and the referenced companion is
    // hidden from the listing, tag pages, and RSS (reachable only via this link).
    zhVersion: z.string().optional(),
    // A/B topic-sourcing attribution (#80): which weekly track produced this
    // post — an agent-chosen topic or a shuke-chosen one. Non-rendered; used
    // only to filter posts by track when comparing the two over time.
    topicSource: z.enum(['agent', 'shuke']).optional(),
  }),
});

export const collections = { products, blog };
