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

推送 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages（自定义域名 [`milislime.com`](https://milislime.com)）。

## 添加内容

- **文章**：在根目录 `articles/<系列文件夹>/<文章文件夹>/` 里放一个 `.md`（文件名随意，可用中文）+ 配图，顶部写 frontmatter（`title`、`description`、`order`、`tag`，可选 `short`、`summary`、`color`、`keywords`），正文写 Markdown。配图用相对路径 `./图片.png` 引用（Astro 会自动优化）。页面、目录、上下章、搜索会自动生成。新增系列时，在 `src/data/series.ts` 加一条 `{ slug, name, order }`。
- **投影文件**：把 `.litematic` 或 `.rar` 文件放进 `public/投影文件/<分类>/`。构建时会自动扫描，列表、首页统计和搜索一起更新，**不需要再修改 TypeScript 清单**。需要补充资料时，按下面的方法添加说明。

### 给投影添加说明

档案馆保留分类列表，点击文件名称会打开详情卡片：桌面左侧显示图片或 3D 预览，右侧显示基础资料与简介；手机上自动上下排列。图片可切换、点击放大，卡片底部提供下载和复制分享链接。点击右上角关闭、遮罩或按 Esc 可返回列表。

原始下载文件和说明分开放置，图片与说明放在同一文件夹。文件夹、文件名都可以使用中文：

```text
public/投影文件/飞船成品/BS--1.litematic   # 原下载文件，保留原名和路径
projections/飞船成品/BS--1/说明.md        # 显示标题、资料和 Markdown 正文
projections/飞船成品/BS--1/外观.png       # 可选，准备好真实图片后再添加
projections/飞船成品/BS--1/结构.png       # 可选，最多两张详情配图
```

1. 在根目录 `projections/<分类>/<名称>/` 新建 `说明.md`，或补充已有说明。每个下载文件只对应一份说明。
2. 用 `file` 指向原文件：填写以 `/投影文件/` 开头的原始路径，不加 `public`，不做 URL 编码。中文、方括号、空格都照原样保留；路径分隔符统一用 `/`，不要用 Windows 的 `\`。
3. 为新说明选择全站唯一的 `id`，只用小写英文字母、数字和连字符，以字母或数字开头。`title` 可以用中文，也可以与原文件名不同；留空时显示原文件名。
4. 作者、版本、参数等可以逐步补充。暂时没有资料就保留 `""` 或 `[]`，正文可以留空；页面会显示待补充提示。文件格式、大小和分类会自动读取。
5. 运行 `npm run build` 检查路径、重复编号和图片。开发时修改说明会由内容集合重新加载，刷新页面即可读取新增下载文件。

下面是 **BS--1 当前骨架的完整格式**，其中各项空值是有意保留的：

```markdown
---
id: sma-0001
title: "BS--1"
file: "/投影文件/飞船成品/BS--1.litematic"
legacyId: f-1
author: ""
versions: []
tags: []
keywords: []
parameters: []
links: []
images: []
---
```

新增说明时替换 `id`、`title` 和 `file`，并省略 `legacyId`。除 `id`、`file` 外，其余元数据都可以省略。需要补充时，将对应空值替换成以下形式；示例中的文字换成实际资料，图片先放入说明旁边：

```yaml
author: "填写确认过的作者署名"
versions:
  - "填写实际测试过的游戏版本"
tags:
  - "填写适用的标签"
keywords:
  - "填写便于搜索的别名"
parameters:
  - label: "填写参数名"
    value: "填写已核实的参数值及单位"
links:
  - label: "站内教程"
    url: "/tutorials/"
  - label: "填写原作者发布页的名称"
    url: "https://example.com/replace-with-real-source"
images:
  - src: "./外观.png"
    alt: "填写图片中实际可见的结构"
    caption: "填写需要说明的视角或细节，可省略"
  - src: "./结构.png"
    alt: "填写第二张图片的内容"
```

`versions`、`tags`、`keywords` 都是字符串列表。参数使用 `label` / `value`，数值也请加引号写成字符串；空参数行不会显示。链接使用 `label` / `url`，只接受 `/` 开头的站内路径或完整的 `http://`、`https://` 地址，不接受 `//` 开头的地址。`images` 可省略或为 `[]`，最多两张；`src` 相对于当前 `说明.md`，由 Astro 的 `image()` 校验和处理，`alt` 描述图片内容，`caption` 可省略。

文件格式与内容类型分开标注：`.rar` 统一视为压缩包，里面可能是投影合集或游戏存档。确认内容后，可在 `说明.md` 顶部的两个 `---` 之间填写 `contentType`，支持 `"投影"`、`"投影合集"`、`"游戏存档"`。例如存档压缩包填写：

```yaml
contentType: "游戏存档"
```

未填写时，`.litematic` 显示“投影”，`.rar` 显示“压缩包”。卡片标签、下载按钮和搜索关键词会随内容类型更新；文件格式与原始下载地址仍由实际文件决定。

第二个 `---` 之后可写普通 Markdown，例如使用步骤、注意事项和设计说明；正文里的图片也可用 `![说明](./图片.png)` 引用，文件名带空格时写成 `![说明](<./图片 1.png>)`。暂时没有说明就留空，或仅写 HTML 注释 `<!-- 待补充说明 -->`。

### 3D 预览与存档的预览模型

`.litematic` 条目自动使用下载文件提供 3D 预览。点击卡片左侧的“3D 预览”或“加载 3D 预览”后才读取文件和启动渲染；切回图片、关闭卡片或离开页面时会释放资源。支持鼠标旋转、平移、缩放，手机支持单指旋转和双指平移、缩放；预览器右上角可复位视角或打开完整预览。加载失败可重试，也可以继续查看图片和下载文件。

`.rar` 压缩包不能直接渲染。如需为游戏存档或合集提供 3D 预览，先导出相应结构的投影，放在 `public/预览文件/`，再在该条目的 `说明.md` 顶部添加：

```yaml
previewFile: "/预览文件/作品名称/预览.litematic"
```

例如上面的路径对应 `public/预览文件/作品名称/预览.litematic`，需要替换成实际文件。也可填写 `/投影文件/` 中已有投影的路径。只用于预览的副本建议放在 `public/预览文件/`，该目录不会额外生成档案条目。`previewFile` 支持 `.litematic`、`.litematica`、`.nbt`，使用未编码的中文路径和 `/` 分隔符；构建会检查文件是否存在。原来的 `file` 仍决定下载内容，所以存档卡片可以预览投影、下载原始 RAR。

渲染使用 [LitematicWebViewer 的内嵌接口](https://github.com/Gudu-Z/LitematicWebViewer#嵌入预览卡片)，从 `https://lwv.loafing.club/embed.js` 按需加载。档案馆先读取本站文件，再将文件数据交给预览器，开发环境也可使用。预览需要访问该服务并支持 WebGL；嵌入文件上限为 64 MiB，大型模型的速度还取决于方块数量和设备性能。当前接口不直接读取游戏存档，也不模拟红石运行。

预览器通过 `theme` / `style` 参数使用本站的深色配色、直角按钮和系统字体，颜色与字体读取 `src/styles/global.css` 的变量。iframe 内部的样式由这些接口参数控制；修改档案馆的普通 CSS 不会直接影响它。操作提示统一显示在卡片下方，打开“完整预览”也会沿用这套外观。

### 分享链接、旧编号和排序

- 每份说明的 `id` 对应稳定链接 `/archive/#p-<id>`，例如 BS--1 为 `/archive/#p-sma-0001`。改显示标题、元数据文件夹名称或移动说明文件夹时，保留 `id` 和 `file` 即可保持链接与下载对应关系。
- 原有 48 个文件已按旧清单顺序建立 `sma-0001` 至 `sma-0048`，并保留 `legacyId: f-1` 至 `f-48`。这些旧编号及 `/archive/#f-1` 等旧链接继续使用，请勿删除、重新编号或分配给新条目。
- 原有下载文件名、下载路径及二进制内容保持原样。`file` 指向的下载目录决定展示分类；说明文件夹用于整理资料。现有分类顺序保留，新发现的分类自动排到后面。同类旧文件按旧编号排序，新增文件随后按文件名排序。
- 新文件即使没有 `说明.md` 也会自动出现，显示原文件名，并根据完整原始下载路径的 SHA-256 前 16 位得到 `auto-…` ID。相同路径的 ID 不受其他文件增删影响；要在以后补说明时保留分享链接，直接把链接中 `p-` 后面的 ID 填入元数据。若需改下载文件路径，应先补充并固定显式 `id`。
- 重复稳定 ID、同一文件多份说明、重复旧编号，以及不存在或不合法的文件引用都会让构建报错，并指出相关说明文件。未填写作者、版本、配图、参数或正文不会报错。

## 目录结构

```
articles/               # 文章（根目录，按「系列/文章」分文件夹，配图与 .md 放一起）
projections/            # 投影说明（根目录，按「分类/名称/说明.md」，配图放旁边）
public/                 # 原样拷贝到 dist（logo、字体、投影文件、CNAME）
src/
  content.config.ts     # 内容集合配置（glob 读取根目录 articles/ 和 projections/）
  pages/                # 页面（index / tutorials / archive / articles/[...slug]）
  layouts/Base.astro    # 全局布局：导航 + 页脚 + 搜索
  data/projections.ts   # 投影类型与已有分类顺序（不再维护文件清单）
  data/series.ts        # 教程系列清单
  lib/projections.ts    # 扫描原文件、关联说明、检查重复 ID、生成稳定链接
  lib/search.ts         # 构建时生成搜索索引
  components/PageHeading.astro # 共用的页面标题、面包屑与内容统计
  components/ProjectionDialog.astro # 共用投影卡片、Markdown 简介与图片预览
  scripts/projection-dialog.ts # 卡片开关、图库切换、分享链接与返回行为
  scripts/projection-viewer.ts # 按需加载 3D、错误重试及渲染资源释放
  styles/global.css     # 工业技术档案馆样式（导航、阅读区、目录、下载列表）
  styles/home-industrial.css # 首页的品牌首屏与工程示意图布局
  styles/projection-dialog.css # 投影卡片与手机布局
```
