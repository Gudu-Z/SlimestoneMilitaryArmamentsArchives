import { createHash } from 'node:crypto';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES, type Projection } from '../data/projections';

export type { Projection } from '../data/projections';

const DOWNLOAD_PREFIX = '/投影文件/';

interface Download {
  file: string;
  fileName: string;
  category: string;
  format: Projection['format'];
  size: number;
}

// 按原始路径排序，不受构建机器的语言设置影响。
function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

async function scanDownloads(): Promise<Download[]> {
  const root = path.resolve('public', '投影文件');
  const files: Download[] = [];

  async function visit(parts: string[]): Promise<void> {
    const directory = path.join(root, ...parts);
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const segments = [...parts, entry.name];
      if (entry.isDirectory()) {
        await visit(segments);
      } else if (entry.isFile() && /\.(litematic|rar)$/i.test(entry.name)) {
        const info = await stat(path.join(root, ...segments));
        files.push({
          file: `${DOWNLOAD_PREFIX}${segments.join('/')}`,
          fileName: entry.name,
          category: parts[0] || '未分类',
          format: /\.rar$/i.test(entry.name) ? 'RAR' : 'LITEMATIC',
          size: info.size,
        });
      }
    }
  }

  await visit([]);
  return files.sort((a, b) => compareText(a.file, b.file));
}

function validateFileReference(file: string, source: string): void {
  const segments = file.slice(DOWNLOAD_PREFIX.length).split('/');
  if (
    !file.startsWith(DOWNLOAD_PREFIX) ||
    /[:\\\u0000-\u001f\u007f]/.test(file) ||
    segments.some(segment => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error(`[投影元数据] ${source} 的 file 无效：${JSON.stringify(file)}。请填写 /投影文件/ 下的原始路径，使用 / 分隔，不能包含 . 或 .. 路径段。`);
  }
}

function claimUnique(owners: Map<string, string>, value: string, source: string, label: string): void {
  const previous = owners.get(value);
  if (previous !== undefined) {
    throw new Error(`[投影元数据] ${label} 重复：${JSON.stringify(value)}（${previous} 与 ${source}）。`);
  }
  owners.set(value, source);
}

function publicFileUrl(file: string): string {
  // + 在路径中是普通字符；Vite 的静态服务器使用 decodeURI，不会还原 %2B。
  return file.split('/').map(segment => encodeURIComponent(segment).replace(/%2B/gi, '+')).join('/');
}

async function resolvePreview(file: string, source: string): Promise<NonNullable<Projection['preview']>> {
  const segments = file.slice(1).split('/');
  if (
    !['/投影文件/', '/预览文件/'].some(prefix => file.startsWith(prefix)) ||
    /[:\\\u0000-\u001f\u007f]/.test(file) ||
    segments.some(segment => !segment || segment === '.' || segment === '..') ||
    !/\.(litematic|litematica|nbt)$/i.test(file)
  ) {
    throw new Error(`[投影元数据] ${source} 的 previewFile 无效：请填写 /投影文件/ 或 /预览文件/ 下未编码的 .litematic、.litematica 或 .nbt 文件路径，不能包含 . 或 .. 路径段。`);
  }
  const info = await stat(path.resolve('public', ...segments)).catch(() => null);
  if (!info?.isFile()) {
    throw new Error(`[投影元数据] ${source} 的 previewFile 不存在：${file}。请核对路径、大小写和空格。`);
  }
  return { url: publicFileUrl(file), fileName: segments.at(-1)!, size: info.size };
}

function formatSize(bytes: number): string {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1).replace(/\.0$/, '')} ${units[unit]}`;
}

/** 已有分类沿用原顺序，新分类按路径顺序接在后面。 */
export function getProjectionCategories(items: Projection[]): string[] {
  const remaining = new Set(items.map(item => item.category));
  const known = CATEGORIES.filter(category => remaining.delete(category));
  return [...known, ...[...remaining].sort(compareText)];
}

/** 每次调用重新读取集合和下载目录，开发时增删文件、修改说明即可更新。 */
export async function getProjections(): Promise<Projection[]> {
  const [downloads, entries] = await Promise.all([scanDownloads(), getCollection('projections')]);
  const files = new Map(downloads.map(file => [file.file, file]));
  const metadata = new Map<string, CollectionEntry<'projections'>>();
  const ids = new Map<string, string>();
  const legacyIds = new Map<string, string>();
  const fileOwners = new Map<string, string>();

  for (const entry of entries) {
    const source = entry.filePath || entry.id;
    const { id, file, legacyId } = entry.data;
    validateFileReference(file, source);
    if (!files.has(file)) {
      throw new Error(`[投影元数据] ${source} 引用的文件不存在或不是本地 .litematic / .rar 文件：${file}。请核对大小写、空格和文件扩展名，file 不要做 URL 编码。`);
    }
    claimUnique(ids, id, source, 'id');
    claimUnique(fileOwners, file, source, '同一文件的说明');
    if (legacyId) claimUnique(legacyIds, legacyId, source, 'legacyId');
    metadata.set(file, entry);
  }

  const items: Projection[] = await Promise.all(downloads.map(async file => {
    const entry = metadata.get(file.file);
    const data = entry?.data;
    // 路径哈希不依赖扫描顺序；补写说明时可沿用此 ID，保持已有分享链接。
    const id = data?.id ?? `auto-${createHash('sha256').update(file.file).digest('hex').slice(0, 16)}`;
    if (!data) claimUnique(ids, id, file.file, 'id');
    const url = publicFileUrl(file.file);
    const preview = data?.previewFile
      ? await resolvePreview(data.previewFile, entry!.filePath || entry!.id)
      : file.format === 'LITEMATIC' ? { url, fileName: file.fileName, size: file.size } : undefined;
    return {
      id,
      title: data?.title?.trim() || file.fileName,
      fileName: file.fileName,
      category: file.category,
      url,
      detailUrl: `/archive/#p-${id}`,
      legacyId: data?.legacyId,
      format: file.format,
      contentType: data?.contentType ?? (file.format === 'RAR' ? '压缩包' : '投影'),
      preview,
      size: file.size,
      sizeLabel: formatSize(file.size),
      author: data?.author?.trim() || undefined,
      versions: (data?.versions ?? []).filter(Boolean),
      tags: (data?.tags ?? []).filter(Boolean),
      keywords: (data?.keywords ?? []).filter(Boolean),
      parameters: (data?.parameters ?? []).filter(parameter => parameter.label && parameter.value),
      links: data?.links ?? [],
      images: data?.images ?? [],
      entry,
    };
  }));

  const categories = getProjectionCategories(items);
  const categoryOrder = new Map(categories.map((category, index) => [category, index]));
  const legacyOrder = (item: Projection) => item.legacyId ? Number(item.legacyId.slice(2)) : Infinity;
  return items.sort((a, b) =>
    categoryOrder.get(a.category)! - categoryOrder.get(b.category)! ||
    legacyOrder(a) - legacyOrder(b) ||
    compareText(a.fileName, b.fileName) ||
    compareText(a.url, b.url),
  );
}
