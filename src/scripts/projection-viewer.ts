const VIEWER_MODULE_URL = 'https://lwv.loafing.club/embed.js?v=sma-theme-1';
const MAX_PREVIEW_BYTES = 64 * 1024 * 1024;
const LOAD_TIMEOUT_MS = 90_000;

interface ViewerStatus {
  type: 'waiting' | 'ready' | 'loading' | 'loaded' | 'error' | 'close-request' | 'handoff-start' | 'handoff-end';
  message?: string;
  progress?: number;
}

interface ViewerCard {
  element: HTMLElement;
  destroy(): void;
}

interface ViewerModule {
  configureLitematicCards(options: { maxActive: number }): void;
  createLitematicCard(container: HTMLElement, options: {
    file: File;
    name: string;
    lang: 'zh';
    pack: 'xk';
    theme: 'dark';
    background: string;
    style: {
      accent: string;
      surface: string;
      text: string;
      muted: string;
      border: string;
      radius: number;
      fontFamily: string;
    };
    controls: { hint: boolean };
    onStatus(event: ViewerStatus): void;
  }): ViewerCard;
}

class PreviewError extends Error {}
let modulePromise: Promise<ViewerModule> | undefined;
let moduleAttempt = 0;

function loadViewerModule(): Promise<ViewerModule> {
  if (!modulePromise) {
    // 失败后使用新地址重试，避免浏览器复用失败的模块请求。
    const url = new URL(VIEWER_MODULE_URL);
    if (moduleAttempt++) url.searchParams.set('retry', String(moduleAttempt));
    modulePromise = import(/* @vite-ignore */ url.href).then((sdk: ViewerModule) => {
      if (typeof sdk.createLitematicCard !== 'function') throw new Error('Viewer API unavailable');
      sdk.configureLitematicCards({ maxActive: 1 });
      return sdk;
    }).catch(() => {
      modulePromise = undefined;
      throw new PreviewError('暂时无法连接预览服务，请重试。');
    });
  }
  return modulePromise;
}

async function readPreviewFile(url: string, name: string, signal: AbortSignal): Promise<File> {
  const response = await fetch(url, { credentials: 'same-origin', signal });
  if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
    throw new PreviewError('未能读取投影文件，请重试或下载文件查看。');
  }
  if (Number(response.headers.get('content-length')) > MAX_PREVIEW_BYTES) {
    await response.body?.cancel();
    throw new PreviewError('预览支持最大 64 MiB 的文件，请下载后查看此投影。');
  }
  const blob = await response.blob();
  if (!blob.size || blob.size > MAX_PREVIEW_BYTES) {
    throw new PreviewError('文件为空或超过 64 MiB，暂时无法在线预览。');
  }
  return new File([blob], name, { type: 'application/octet-stream' });
}

/** 每张详情卡片一个控制器；关闭、切换条目或切回图片时销毁渲染器。 */
export function initializeProjectionViewer(root: HTMLElement, onClose: () => void): () => void {
  const media = root.querySelector<HTMLElement>('.projection-media');
  if (!media?.dataset.previewUrl) return () => {};

  const tabs = Array.from(media.querySelectorAll<HTMLButtonElement>('[data-media-tab]'));
  const photos = media.querySelector<HTMLElement>('#projection-images')!;
  const counter = media.querySelector<HTMLElement>('[data-image-counter]')!;
  const panel = media.querySelector<HTMLElement>('[data-model-panel]')!;
  const mount = media.querySelector<HTMLElement>('[data-model-mount]')!;
  const message = media.querySelector<HTMLElement>('[data-model-message]')!;
  const status = media.querySelector<HTMLElement>('[data-model-status]')!;
  const detail = media.querySelector<HTMLElement>('[data-model-detail]')!;
  const announcement = media.querySelector<HTMLElement>('[data-model-announcement]')!;
  const progress = media.querySelector<HTMLProgressElement>('[data-model-progress]')!;
  const retry = media.querySelector<HTMLButtonElement>('[data-retry-model]')!;
  const hint = media.querySelector<HTMLElement>('[data-model-hint]')!;
  const handoff = media.querySelector<HTMLElement>('[data-model-handoff]')!;
  const listeners = new AbortController();
  let request: AbortController | undefined;
  let card: ViewerCard | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let disposed = false;

  function stop() {
    generation++;
    request?.abort();
    request = undefined;
    clearTimeout(timer);
    card?.destroy();
    card = undefined;
    mount.replaceChildren();
    mount.inert = true;
    panel.setAttribute('aria-busy', 'false');
    handoff.hidden = true;
    hint.hidden = false;
  }

  function isCurrent(job: number) {
    return !disposed && job === generation && !panel.hidden && media!.isConnected;
  }

  function setState(state: 'idle' | 'loading' | 'loaded' | 'error', title: string, description = '', fraction?: number) {
    panel.dataset.state = state;
    panel.setAttribute('aria-busy', String(state === 'loading'));
    message.hidden = state === 'loaded';
    mount.inert = state !== 'loaded';
    status.textContent = title;
    detail.textContent = description;
    if (announcement.textContent !== title) announcement.textContent = title;
    retry.hidden = state !== 'error';
    progress.hidden = state !== 'loading';
    if (fraction !== undefined && Number.isFinite(fraction)) progress.value = Math.max(0, Math.min(1, fraction));
    else progress.removeAttribute('value');
  }

  function fail(job: number, description: string) {
    if (!isCurrent(job)) return;
    stop();
    setState('error', '3D 预览未能加载', description);
  }

  function watchLoading(job: number) {
    clearTimeout(timer);
    timer = setTimeout(() => fail(job, '加载时间较长，请重试，也可以先下载文件查看。'), LOAD_TIMEOUT_MS);
  }

  async function start() {
    stop();
    const job = generation;
    if (Number(media!.dataset.previewSize) > MAX_PREVIEW_BYTES) {
      fail(job, '预览支持最大 64 MiB 的文件，请下载后查看此投影。');
      return;
    }
    request = new AbortController();
    setState('loading', '正在加载 3D 预览', '首次加载需要读取投影与材质，请稍候。');
    watchLoading(job);
    try {
      const [sdk, file] = await Promise.all([
        loadViewerModule(),
        readPreviewFile(media!.dataset.previewUrl!, media!.dataset.previewName!, request.signal),
      ]);
      if (!isCurrent(job)) return;
      // 跨域 iframe 的内部按钮通过 SDK 主题配置与本站保持一致。
      const siteStyle = getComputedStyle(root);
      const token = (name: string) => siteStyle.getPropertyValue(name).trim();
      const created = sdk.createLitematicCard(mount, {
        file,
        name: media!.dataset.previewTitle || file.name,
        lang: 'zh',
        pack: 'xk',
        theme: 'dark',
        background: '#12170f',
        style: {
          accent: token('--green-bright'),
          surface: token('--surface'),
          text: token('--text'),
          muted: token('--muted'),
          border: token('--line'),
          radius: 0,
          fontFamily: token('--font-sans'),
        },
        // 卡片下方已有鼠标与触屏操作提示，避免重复覆盖模型。
        controls: { hint: false },
        onStatus(event) {
          if (!isCurrent(job)) return;
          if (event.type === 'close-request') { onClose(); return; }
          if (event.type === 'handoff-start' || event.type === 'handoff-end') {
            handoff.hidden = event.type === 'handoff-end';
            hint.hidden = !handoff.hidden;
            return;
          }
          if (event.type === 'loaded') {
            clearTimeout(timer);
            setState('loaded', '3D 预览已加载，可以旋转、平移和缩放结构。');
          } else if (event.type === 'error') {
            fail(job, /webgl/i.test(event.message || '')
              ? '浏览器未能启动 3D 渲染，请尝试其他浏览器，或下载文件查看。'
              : '预览服务或投影解析暂时遇到问题，请重试，或下载文件查看。');
          } else {
            watchLoading(job);
            setState('loading', '正在生成 3D 预览', '加载完成后即可拖动查看结构。', event.progress);
          }
        },
      });
      if (!isCurrent(job)) { created.destroy(); return; }
      card = created;
      card.element.style.background = '#12170f';
    } catch (error) {
      fail(job, error instanceof PreviewError ? error.message : '加载失败，请检查网络后重试，或下载文件查看。');
    }
  }

  function selectMode(mode: 'images' | 'model') {
    const changed = panel.hidden !== (mode === 'images');
    tabs.forEach(tab => {
      const selected = tab.dataset.mediaTab === mode;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panel.hidden = mode !== 'model';
    photos.hidden = mode !== 'images';
    counter.hidden = mode !== 'images';
    if (mode === 'images') {
      stop();
      setState('idle', '准备加载 3D 预览');
      announcement.textContent = '';
    } else if (changed || panel.dataset.state === 'idle') {
      void start();
    }
  }

  // 返回浏览器缓存页面时也从图片开始，不自动重新启动 3D。
  selectMode('images');
  media.addEventListener('click', event => {
    const target = event.target as Element | null;
    const tab = target?.closest<HTMLButtonElement>('[data-media-tab]');
    if (tab) selectMode(tab.dataset.mediaTab as 'images' | 'model');
    else if (target?.closest('[data-open-model]')) {
      tabs.find(button => button.dataset.mediaTab === 'model')!.focus({ preventScroll: true });
      selectMode('model');
    } else if (target?.closest('[data-retry-model]')) void start();
  }, { signal: listeners.signal });

  media.addEventListener('keydown', event => {
    const tab = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-media-tab]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs.forEach((button, i) => { button.tabIndex = i === index ? 0 : -1; });
    tabs[index].focus({ preventScroll: true });
    // 方向键只移动焦点；Enter / Space 才激活，避免意外下载模型。
  }, { signal: listeners.signal });

  return () => {
    disposed = true;
    listeners.abort();
    stop();
  };
}
