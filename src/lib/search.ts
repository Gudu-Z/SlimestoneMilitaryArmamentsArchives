import { getCollection } from 'astro:content';
import { PROJECTIONS } from '../data/projections';

export interface SearchEntry {
  type: 'article' | 'file';
  title: string;
  url: string;
  cat?: string;
  keys: string;
}

// 构建时生成搜索索引：文章（标题+关键词）+ 投影文件（文件名+分类）
export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const articles = await getCollection('articles');
  const articleEntries: SearchEntry[] = articles
    .sort((a, b) => a.data.order - b.data.order)
    .map((a) => ({
      type: 'article',
      title: a.data.title,
      url: `/articles/${a.id}/`,
      keys: a.data.keywords || '',
    }));

  const fileEntries: SearchEntry[] = PROJECTIONS.map((p, i) => ({
    type: 'file',
    title: p.title,
    url: `/archive/#f-${i + 1}`,
    cat: p.category,
    keys: p.category,
  }));

  return [...articleEntries, ...fileEntries];
}
