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

export const collections = { products };
