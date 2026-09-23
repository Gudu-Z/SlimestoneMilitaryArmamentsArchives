// 教程系列清单
// slug = src/content/articles/ 下的文件夹名；name = 展示名；order = 系列排序
export interface Series {
  slug: string;
  name: string;
  order: number;
}

export const SERIES: Series[] = [
  { slug: '从0开始的je航械入门', name: '从0开始的 JE 航械入门', order: 1 },
];
