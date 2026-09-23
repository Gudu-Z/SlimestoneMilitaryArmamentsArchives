# SMAA 军用绿萌档案馆

这里是 **军用绿萌军备（SMA）** 的档案馆，用来存放开源的机器投影、《从0开始的JE航械入门》视频稿等。网站基于 [Astro](https://astro.build) 构建，纯静态输出，托管在 GitHub Pages。

## 关于我们

我们是 **军用绿萌军备 Slimestone Military Armaments**，一个聚焦于 Java 版 Minecraft 航械领域（绿萌战舰、可移动建筑与可移动计算机等非生存实用性飞行器科技）的玩家组织，欢迎各位的加入。

QQ群：993080537

## 本地开发

```bash
npm install     # 安装依赖（仅首次）
npm run dev     # 启动开发服务器，默认 http://localhost:4321
```

## 构建

```bash
npm run build   # 产物输出到 dist/
npm run preview # 本地预览构建产物
```

## 部署

推送 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages（自定义域名 `sma.loafing.club`）。

## 添加内容

- **文章**：在根目录 `articles/<系列文件夹>/<文章文件夹>/` 里放一个 `.md`（文件名随意，可用中文）+ 配图，顶部写 frontmatter（`title`、`description`、`order`、`tag`，可选 `short`、`summary`、`color`、`keywords`），正文写 Markdown。配图用相对路径 `./图片.png` 引用（Astro 会自动优化）。页面、目录、上下章、搜索会自动生成。新增系列时，在 `src/data/series.ts` 加一条 `{ slug, name, order }`。
- **投影文件**：把文件放进 `public/投影文件/<分类>/`，并在 `src/data/projections.ts` 的数组里加一条 `{ title, category }`。档案馆列表和搜索会自动更新。

## 目录结构

```
articles/               # 文章（根目录，按「系列/文章」分文件夹，配图与 .md 放一起）
public/                 # 原样拷贝到 dist（logo、字体、投影文件、CNAME）
src/
  content.config.ts     # 内容集合配置（glob 加载器读取根目录 articles/）
  pages/                # 页面（index / tutorials / archive / articles/[...slug]）
  layouts/Base.astro    # 全局布局：导航 + 页脚 + 搜索
  data/projections.ts   # 投影文件清单
  data/series.ts        # 教程系列清单
  lib/search.ts         # 构建时生成搜索索引
  styles/global.css     # 玻璃拟态样式
```
