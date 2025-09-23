export function installDndDebug() {
  try {
    if (typeof window === 'undefined') return () => {};

    const debug = !!(window as any).__DND_DEBUG;
    if (!debug) return () => {};

    // mark that debug listeners were installed (helps runtime inspection)
    try {
      (window as any).__DND_DEBUG_INSTALLED = true;
    } catch (err) {
      // ignore
    }

    console.info('[DND DEBUG] Debug mode enabled — listening to native drag events');

    const onDragStart = (e: Event) => {
      console.debug('[DND DEBUG] dragstart', e);
      try {
        const dt = (e as DragEvent).dataTransfer;
        console.debug('[DND DEBUG] dataTransfer:', dt ? {
          types: dt.types ? Array.from(dt.types) : undefined,
          items: dt && (dt as any).items ? Array.from((dt as any).items).map((it: any) => it.type) : undefined
        } : null);
      } catch (err) {
        // ignore
      }
    };

    const onDragOver = (e: Event) => console.debug('[DND DEBUG] dragover', e);
    const onDrop = (e: Event) => {
      console.debug('[DND DEBUG] drop', e);
      try {
        const dt = (e as DragEvent).dataTransfer;
        console.debug('[DND DEBUG] drop dataTransfer:', dt ? {
          types: dt.types ? Array.from(dt.types) : undefined,
        } : null);
      } catch (err) {}
    };

    window.addEventListener('dragstart', onDragStart, true);
    window.addEventListener('dragover', onDragOver, true);
    window.addEventListener('drop', onDrop, true);

    return () => {
      try {
        window.removeEventListener('dragstart', onDragStart, true);
        window.removeEventListener('dragover', onDragOver, true);
        window.removeEventListener('drop', onDrop, true);
      } finally {
        try {
          (window as any).__DND_DEBUG_INSTALLED = false;
        } catch (err) {}
      }
    };
  } catch (err) {
    // If anything fails, silently no-op
    return () => {};
  }
}

export default installDndDebug;
