import { initializeProjectionViewer } from './projection-viewer';

const dialog = document.querySelector<HTMLDialogElement>('.projection-dialog');
const lightbox = document.querySelector<HTMLDialogElement>('.projection-lightbox');
const content = dialog?.querySelector<HTMLElement>('.projection-content');

if (dialog && lightbox && content) initialize(dialog, lightbox, content);

function initialize(dialog: HTMLDialogElement, lightbox: HTMLDialogElement, content: HTMLElement) {
  const templates = new Map<string, HTMLTemplateElement>();
  const hashes = new Map<string, string>();
  document.querySelectorAll<HTMLTemplateElement>('[data-projection-template]').forEach(template => {
    const id = template.dataset.projectionId!;
    templates.set(id, template);
    hashes.set(`p-${id}`, id);
    if (template.dataset.legacyId) hashes.set(template.dataset.legacyId, id);
  });

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const owner = `projection-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const image = lightbox.querySelector<HTMLImageElement>('[data-lightbox-image]')!;
  const caption = lightbox.querySelector<HTMLElement>('[data-lightbox-caption]')!;
  let currentId: string | null = null;
  let returnFocus: HTMLElement | null = null;
  let savedScroll = { x: 0, y: 0 };
  let previousRestoration: ScrollRestoration = history.scrollRestoration;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let imageCloseTimer: ReturnType<typeof setTimeout> | undefined;
  let closing = false;
  let closeRequested = false;
  let disposeViewer: (() => void) | undefined;

  function idFromHash(hash: string) {
    try { return hashes.get(decodeURIComponent(hash.replace(/^#/, ''))); }
    catch { return undefined; }
  }

  function resetScroll() {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(savedScroll.x, savedScroll.y);
    root.style.scrollBehavior = previousBehavior;
  }

  function closeImage(immediate = false) {
    clearTimeout(imageCloseTimer);
    if (!lightbox.open) return;
    lightbox.classList.remove('is-visible');
    const finish = () => {
      if (lightbox.open) lightbox.close();
      image.removeAttribute('src');
    };
    if (immediate || reducedMotion.matches) finish();
    else imageCloseTimer = setTimeout(finish, 220);
  }

  function showProjection(id: string, trigger?: HTMLElement) {
    const template = templates.get(id);
    if (!template) return;
    clearTimeout(closeTimer);
    closing = false;
    closeRequested = false;
    const wasOpen = dialog.open;
    if (!wasOpen) {
      savedScroll = { x: window.scrollX, y: window.scrollY };
      previousRestoration = history.scrollRestoration;
      history.scrollRestoration = 'manual';
      document.documentElement.classList.add('projection-open');
    }
    if (currentId !== id || !wasOpen || !disposeViewer) {
      closeImage(true);
      disposeViewer?.();
      content.replaceChildren(template.content.cloneNode(true));
      disposeViewer = initializeProjectionViewer(content, requestClose);
      dialog.scrollTop = 0;
      returnFocus = trigger?.matches('.file-detail') ? trigger : document.querySelector<HTMLElement>(`.file-detail[data-projection-id="${CSS.escape(id)}"]`);
      currentId = id;
      document.querySelectorAll('.file-item.is-selected').forEach(row => row.classList.remove('is-selected'));
      returnFocus?.closest('.file-item')?.classList.add('is-selected');
    }
    if (!wasOpen) dialog.showModal();
    void dialog.offsetWidth;
    dialog.classList.add('is-visible');
    if (!wasOpen) dialog.querySelector<HTMLButtonElement>('[data-close-projection]')?.focus({ preventScroll: true });
  }

  function hideProjection() {
    if (!currentId || closing) return;
    closing = true;
    disposeViewer?.();
    disposeViewer = undefined;
    closeImage(true);
    dialog.classList.remove('is-visible');
    const finish = () => {
      dialog.close();
      content.replaceChildren();
      document.documentElement.classList.remove('projection-open');
      resetScroll();
      history.scrollRestoration = previousRestoration;
      returnFocus?.focus({ preventScroll: true });
      currentId = null;
      closing = false;
      closeRequested = false;
    };
    if (!dialog.open || reducedMotion.matches) finish();
    else closeTimer = setTimeout(finish, 220);
  }

  function openFromLink(id: string, trigger?: HTMLElement) {
    if (!templates.has(id)) return;
    if (idFromHash(location.hash) !== id) {
      history.pushState({ ...history.state, smaProjection: { owner } }, '', templates.get(id)!.dataset.detailUrl);
    }
    showProjection(id, trigger);
  }

  function requestClose() {
    if (!currentId || closing || closeRequested) return;
    closeRequested = true;
    if (history.state?.smaProjection?.owner === owner) {
      history.back();
    } else {
      const state = { ...history.state };
      delete state.smaProjection;
      history.replaceState(state, '', location.pathname + location.search);
      hideProjection();
    }
  }

  function syncLocation() {
    const id = idFromHash(location.hash);
    if (id) showProjection(id);
    else hideProjection();
  }

  // 保留链接的原生新标签页操作；普通点击与搜索结果均打开同一张卡片。
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const target = event.target as Element | null;
    const link = target?.closest<HTMLAnchorElement>('a[href]');
    if (!link || link.hasAttribute('download') || link.target === '_blank') return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname) return;
    const id = idFromHash(url.hash);
    if (!id) return;
    event.preventDefault();
    openFromLink(id, link);
  });

  dialog.querySelector('[data-close-projection]')!.addEventListener('click', requestClose);
  dialog.addEventListener('cancel', event => {
    if (event.cancelable) { event.preventDefault(); requestClose(); }
  });
  // 浏览器可能直接关闭从分享链接打开的弹窗，仍需同步 URL、滚动锁与焦点。
  dialog.addEventListener('close', () => {
    if (!closing && currentId) requestClose();
  });
  lightbox.querySelector('[data-close-image]')!.addEventListener('click', () => closeImage());
  lightbox.addEventListener('cancel', event => {
    event.stopPropagation();
    if (event.cancelable) { event.preventDefault(); closeImage(); }
  });
  lightbox.addEventListener('close', () => {
    clearTimeout(imageCloseTimer);
    lightbox.classList.remove('is-visible');
    image.removeAttribute('src');
  });

  function onBackdrop(element: HTMLDialogElement, close: () => void) {
    let startedOutside = false;
    const outside = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    element.addEventListener('pointerdown', event => { startedOutside = event.target === element && outside(event); });
    element.addEventListener('click', event => {
      if (startedOutside && event.target === element && outside(event)) close();
      startedOutside = false;
    });
  }
  onBackdrop(dialog, requestClose);
  onBackdrop(lightbox, () => closeImage());

  function selectImage(index: string) {
    content.querySelectorAll<HTMLElement>('[data-gallery-frame]').forEach(frame => { frame.hidden = frame.dataset.imageIndex !== index; });
    content.querySelectorAll<HTMLButtonElement>('[data-gallery-thumbnail]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.imageIndex === index)));
    const frame = content.querySelector<HTMLElement>(`[data-gallery-frame][data-image-index="${CSS.escape(index)}"]`);
    const counter = content.querySelector<HTMLElement>('[data-image-counter]');
    const imageCaption = content.querySelector<HTMLElement>('[data-image-caption-text]');
    if (frame && imageCaption) imageCaption.textContent = frame.dataset.imageCaption || '';
    if (counter) counter.textContent = `${String(Number(index) + 1).padStart(2, '0')} / ${String(content.querySelectorAll('[data-gallery-frame]').length).padStart(2, '0')}`;
  }

  content.addEventListener('click', async event => {
    const target = event.target as Element | null;
    const thumbnail = target?.closest<HTMLButtonElement>('[data-gallery-thumbnail]');
    if (thumbnail) { selectImage(thumbnail.dataset.imageIndex!); return; }
    const preview = target?.closest<HTMLButtonElement>('[data-gallery-frame]');
    if (preview) {
      clearTimeout(imageCloseTimer);
      image.src = preview.dataset.fullImage!;
      image.alt = preview.querySelector('img')!.alt;
      caption.textContent = preview.dataset.imageCaption || image.alt;
      if (!lightbox.open) lightbox.showModal();
      void lightbox.offsetWidth;
      lightbox.classList.add('is-visible');
      return;
    }
    if (target?.closest('[data-copy-projection]') && currentId) {
      const id = currentId;
      const url = new URL(templates.get(id)!.dataset.detailUrl!, location.origin).href;
      const status = content.querySelector<HTMLElement>('[data-copy-status]')!;
      try {
        await navigator.clipboard.writeText(url);
        if (id === currentId) status.textContent = '链接已复制';
      } catch {
        if (id !== currentId) return;
        const fallback = content.querySelector<HTMLElement>('[data-share-fallback]')!;
        const input = fallback.querySelector('input')!;
        fallback.hidden = false;
        input.value = url;
        input.focus({ preventScroll: true });
        input.select();
        status.textContent = '请复制下方链接';
      }
    }
  });

  content.addEventListener('keydown', event => {
    const target = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-gallery-thumbnail]');
    if (!target || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(content.querySelectorAll<HTMLButtonElement>('[data-gallery-thumbnail]'));
    const index = (buttons.indexOf(target) + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    selectImage(buttons[index].dataset.imageIndex!);
    buttons[index].focus({ preventScroll: true });
  });

  window.addEventListener('popstate', syncLocation);
  window.addEventListener('hashchange', syncLocation);
  window.addEventListener('pagehide', () => disposeViewer?.());
  window.addEventListener('pageshow', event => {
    if (event.persisted && currentId && dialog.open) disposeViewer = initializeProjectionViewer(content, requestClose);
  });
  // 直接打开分享链接时补上列表这一层历史，返回键可先关闭卡片。
  const initialId = idFromHash(location.hash);
  if (initialId) {
    const original = location.href;
    const state = { ...history.state };
    if (!state.smaProjection) {
      history.replaceState(state, '', location.pathname + location.search);
      history.pushState({ ...state, smaProjection: { owner } }, '', original);
    } else {
      history.replaceState({ ...state, smaProjection: { owner } }, '', original);
    }
    showProjection(initialId);
  }
}
