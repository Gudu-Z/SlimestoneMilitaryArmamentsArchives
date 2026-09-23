import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    short: z.string().optional(),
    description: z.string(),
    summary: z.string().optional(),
    color: z.string().optional(),
    order: z.number(),
    tag: z.string(),
    keywords: z.string().optional(),
  }),
});

export const collections = { articles };
