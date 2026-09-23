import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './articles',
    generateId: ({ entry }) => {
      // 每个文章一个文件夹，.md 文件名任意；ID 取「系列/文章」文件夹路径
      const segments = entry.replace(/\\/g, '/').split('/');
      segments.pop(); // 去掉 .md 文件名
      return segments.join('/');
    },
  }),
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
