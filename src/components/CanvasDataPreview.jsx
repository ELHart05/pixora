import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

export function CanvasDataPreview({ data, title, className = 'w-full h-full bg-[#1e2128]' }) {
  const canvasElRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const canvasEl = canvasElRef.current;
    const wrapperEl = wrapperRef.current;
    if (!canvasEl || !wrapperEl || !data) return;

    const staticCanvas = new fabric.StaticCanvas(canvasEl, {
      backgroundColor: '#1e2128',
      renderOnAddRemove: false,
    });

    function fitCanvas() {
      const width = Math.max(1, wrapperEl.clientWidth);
      const height = Math.max(1, wrapperEl.clientHeight || Math.round(width * 0.5625));
      staticCanvas.setWidth(width);
      staticCanvas.setHeight(height);
      staticCanvas.calcOffset();
      staticCanvas.requestRenderAll();
    }

    function fitContent() {
      const objects = staticCanvas.getObjects();
      if (!objects.length) return;

      const bounds = objects.reduce(
        (acc, obj) => {
          const rect = obj.getBoundingRect(true, true);
          return {
            left: Math.min(acc.left, rect.left),
            top: Math.min(acc.top, rect.top),
            right: Math.max(acc.right, rect.left + rect.width),
            bottom: Math.max(acc.bottom, rect.top + rect.height),
          };
        },
        { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
      );
      const contentWidth = Math.max(1, bounds.right - bounds.left);
      const contentHeight = Math.max(1, bounds.bottom - bounds.top);
      const scale = Math.min(
        (staticCanvas.getWidth() - 32) / contentWidth,
        (staticCanvas.getHeight() - 32) / contentHeight,
        1.4
      );

      staticCanvas.setViewportTransform([
        scale,
        0,
        0,
        scale,
        (staticCanvas.getWidth() - contentWidth * scale) / 2 - bounds.left * scale,
        (staticCanvas.getHeight() - contentHeight * scale) / 2 - bounds.top * scale,
      ]);
    }

    fitCanvas();
    const resizeObserver = new ResizeObserver(() => {
      fitCanvas();
      fitContent();
      staticCanvas.requestRenderAll();
    });
    resizeObserver.observe(wrapperEl);

    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      staticCanvas.loadFromJSON(parsed, () => {
        fitContent();
        staticCanvas.renderAll();
      });
    } catch {
      staticCanvas.renderAll();
    }

    return () => {
      resizeObserver.disconnect();
      staticCanvas.dispose();
    };
  }, [data]);

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvasElRef} aria-label={title} className="block w-full h-full" />
    </div>
  );
}
