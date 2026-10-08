import { getCollection } from 'astro:content';
import { getProjections } from './projections';

export interface SearchEntry {
  type: 'article' | 'file';
  title: string;
  url: string;
  cat?: string;
  keys: string;
}

// 构建时生成搜索索引：文章（标题+关键词）+ 投影文件（显示标题+原文件名+元数据）
export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const [articles, projections] = await Promise.all([getCollection('articles'), getProjections()]);
  const articleEntries: SearchEntry[] = articles
    .sort((a, b) => a.data.order - b.data.order)
    .map((a) => ({
      type: 'article',
      title: a.data.title,
      url: `/articles/${a.id}/`,
      keys: a.data.keywords || '',
    }));

  const fileEntries: SearchEntry[] = projections.map((p) => ({
    type: 'file',
    title: p.title,
    url: p.detailUrl,
    cat: p.category,
    keys: [p.fileName, ...p.keywords, ...p.tags, p.category, p.contentType, p.author].filter(Boolean).join(' '),
  }));

  return [...articleEntries, ...fileEntries];
}
