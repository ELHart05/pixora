export const EDITOR_LOAD_EVENT = 'pixora:load-canvas';

export function stageEditorCanvasLoad({ data, id = null, title = '', description = '', isPublic = false }) {
  if (!data) return;

  localStorage.setItem('pixora-load-canvas', data);
  if (id) localStorage.setItem('pixora-load-canvas-id', id);
  else localStorage.removeItem('pixora-load-canvas-id');

  localStorage.setItem('pixora-load-canvas-meta', JSON.stringify({
    title,
    description,
    isPublic: !!isPublic,
  }));

  window.dispatchEvent(new CustomEvent(EDITOR_LOAD_EVENT));
}

export function consumePendingEditorCanvasLoad() {
  const explicitLoadJSON = localStorage.getItem('pixora-load-canvas');
  const loadCanvasId = localStorage.getItem('pixora-load-canvas-id');
  const loadCanvasMeta = localStorage.getItem('pixora-load-canvas-meta');

  if (!explicitLoadJSON && !loadCanvasId && !loadCanvasMeta) return null;

  localStorage.removeItem('pixora-load-canvas');
  localStorage.removeItem('pixora-load-canvas-id');
  localStorage.removeItem('pixora-load-canvas-meta');

  let meta = null;
  if (loadCanvasMeta) {
    try {
      meta = JSON.parse(loadCanvasMeta);
    } catch {
      meta = null;
    }
  }

  return {
    data: explicitLoadJSON,
    id: loadCanvasId || null,
    meta,
  };
}
