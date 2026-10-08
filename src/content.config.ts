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

function isAllowedLink(value: string): boolean {
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const projections = defineCollection({
  loader: glob({
    pattern: '**/说明.md',
    base: './projections',
    // 集合 ID 使用完整路径，避免相同稳定 ID 被加载器覆盖后无法检查。
    // 对外分享只用 data.id；文件夹改名不会改变分享链接。
    generateId: ({ entry }) => entry.replace(/\\/g, '/'),
  }),
  schema: ({ image }) => z.object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'id 只能使用小写英文字母、数字和连字符，并以字母或数字开头'),
    title: z.string().trim().optional(),
    file: z.string().startsWith('/投影文件/', 'file 必须是 /投影文件/ 下未编码的原始文件路径'),
    contentType: z.enum(['投影', '投影合集', '游戏存档']).optional(),
    previewFile: z.string().startsWith('/', 'previewFile 使用 public 下未编码的文件路径，以 / 开头').optional(),
    legacyId: z.string().regex(/^f-[1-9]\d*$/, 'legacyId 格式为 f-1、f-2 等').optional(),
    author: z.string().trim().optional(),
    versions: z.array(z.string().trim()).default([]),
    tags: z.array(z.string().trim()).default([]),
    keywords: z.array(z.string().trim()).default([]),
    parameters: z.array(z.object({
      label: z.string().trim(),
      value: z.string().trim(),
    })).default([]),
    links: z.array(z.object({
      label: z.string().trim().min(1),
      url: z.string().trim().refine(isAllowedLink, '链接只支持以 / 开头的站内路径或完整的 http(s) 地址'),
    })).default([]),
    images: z.array(z.object({
      src: image(),
      alt: z.string().trim(),
      caption: z.string().trim().optional(),
    })).max(2, '每个投影最多添加两张图片').default([]),
  }),
});

export const collections = { articles, projections };
