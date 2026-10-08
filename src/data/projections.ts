import type { ImageMetadata } from 'astro';
import type { CollectionEntry } from 'astro:content';

// 文件来自 public/投影文件，说明来自根目录 projections；无需维护 TS 文件清单。
export interface Projection {
  id: string;
  title: string;
  fileName: string;
  category: string;
  url: string;
  detailUrl: string;
  legacyId?: string;
  format: 'LITEMATIC' | 'RAR';
  contentType: '投影' | '投影合集' | '游戏存档' | '压缩包';
  preview?: { url: string; fileName: string; size: number };
  size: number;
  sizeLabel: string;
  author?: string;
  versions: string[];
  tags: string[];
  keywords: string[];
  parameters: { label: string; value: string }[];
  links: { label: string; url: string }[];
  images: { src: ImageMetadata; alt: string; caption?: string }[];
  entry?: CollectionEntry<'projections'>;
}

// 分类展示顺序（与档案馆页面一致）
export const CATEGORIES = [
  "飞船成品",
  "导弹",
  "炮",
  "轰炸机",
  "舰载飞行器",
  "装甲",
  "多向",
  "标准结构",
  "tnt复制结构",
  "其他模块",
  "半成品",
] as const;
