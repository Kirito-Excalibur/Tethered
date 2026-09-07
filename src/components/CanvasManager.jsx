import { useEffect, useRef } from "react";
import { Canvas } from "fabric";

function getPinchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPinchCenter(touches) {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

export default function CanvasManager({
  setFabricCanvas,
  setContextMenuPos,
  setIsContextMenuActive,
  setCurrentZoom,
  isViewMode,
}) {
  const canvasRef = useRef(null);
  const canvasInstanceRef = useRef(null);
  const isViewModeRef = useRef(isViewMode);

  // Keep ref in sync with prop so event handler closures always see current mode
  useEffect(() => {
    isViewModeRef.current = isViewMode;
  }, [isViewMode]);

  // Update canvas interactivity whenever mode changes
  useEffect(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas || !canvas.upperCanvasEl) return;

    canvas.selection = !isViewMode;
    canvas.defaultCursor = isViewMode ? 'grab' : 'default';
    canvas.setCursor(isViewMode ? 'grab' : 'default');

    canvas.getObjects().forEach(obj => {
      obj.selectable = !isViewMode;
      obj.evented = !isViewMode;
    });
    canvas.requestRenderAll();
  }, [isViewMode]);

  useEffect(() => {
    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#f5f5f5',
    });

    canvasInstanceRef.current = canvas;
    setFabricCanvas(canvas);

    let isSpacePanning = false;
    let isEditingText = false;
    let lastPanPoint = null;

    // ── Resize ──────────────────────────────────────────────────────────────
    const handleResize = () => {
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(window.innerHeight);
      canvas.requestRenderAll();
    };
    window.addEventListener('resize', handleResize);

    // ── Keyboard pan (Space + drag) ──────────────────────────────────────────
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' && !isEditingText) {
        e.preventDefault();
        isSpacePanning = true;
        canvas.defaultCursor = 'grab';
        canvas.setCursor('grab');
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpacePanning = false;
        canvas.isDragging = false;
        lastPanPoint = null;
        if (!isViewModeRef.current) {
          canvas.selection = true;
          canvas.defaultCursor = 'default';
          canvas.setCursor('default');
        } else {
          canvas.setCursor('grab');
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // ── Mouse pan & click ────────────────────────────────────────────────────
    canvas.on('mouse:down', (opt) => {
      const e = opt.e;
      const isMiddleClick = e.button === 1;
      // In view mode, left-click always pans. In edit mode, only space/middle.
      const shouldPan = (isViewModeRef.current && e.button === 0) || isSpacePanning || isMiddleClick;

      if (shouldPan) {
        canvas.isDragging = true;
        if (!isViewModeRef.current) canvas.selection = false;
        lastPanPoint = { x: e.clientX, y: e.clientY };
        if (isMiddleClick) e.preventDefault();
        if (isViewModeRef.current) canvas.setCursor('grabbing');
      }

      if (e.button === 0) setIsContextMenuActive(false);
    });

    canvas.on('mouse:move', (opt) => {
      if (!canvas.isDragging || !lastPanPoint) return;
      const e = opt.e;
      const vpt = [...canvas.viewportTransform];
      vpt[4] += e.clientX - lastPanPoint.x;
      vpt[5] += e.clientY - lastPanPoint.y;
      canvas.setViewportTransform(vpt);
      lastPanPoint = { x: e.clientX, y: e.clientY };
      canvas.setCursor(isViewModeRef.current ? 'grabbing' : 'grabbing');
    });

    canvas.on('mouse:up', () => {
      canvas.isDragging = false;
      lastPanPoint = null;
      if (isViewModeRef.current) {
        canvas.setCursor('grab');
      } else {
        canvas.selection = !isSpacePanning;
        canvas.setCursor(isSpacePanning ? 'grab' : 'default');
      }
    });

    // ── Wheel zoom ───────────────────────────────────────────────────────────
    const handleWheel = (e) => {
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** e.deltaY;
      zoom = Math.min(Math.max(zoom, 0.05), 10);
      canvas.zoomToPoint({ x: e.offsetX, y: e.offsetY }, zoom);
      setCurrentZoom(zoom * 100);
      e.preventDefault();
      e.stopPropagation();
    };
    canvas.upperCanvasEl.addEventListener('wheel', handleWheel, { passive: false });

    // ── Context menu ─────────────────────────────────────────────────────────
    const handleContextMenu = (e) => {
      e.preventDefault();
      if (isViewModeRef.current) return;
      setContextMenuPos({ x: e.clientX, y: e.clientY });
      setIsContextMenuActive(true);
    };
    canvas.upperCanvasEl.addEventListener('contextmenu', handleContextMenu);

    // ── Text editing state ───────────────────────────────────────────────────
    canvas.on('text:editing:entered', () => { isEditingText = true; });
    canvas.on('text:editing:exited', () => { isEditingText = false; });

    // Textbox selection highlight
    canvas.on('selection:created', (event) => {
      event.selected?.forEach(obj => {
        if (obj.type === 'textbox') obj.set({ backgroundColor: 'rgba(59, 130, 246, 0.08)' });
      });
      canvas.requestRenderAll();
    });
    canvas.on('selection:cleared', (event) => {
      event.deselected?.forEach(obj => {
        if (obj.type === 'textbox') obj.set({ backgroundColor: '' });
      });
      canvas.requestRenderAll();
    });

    // ── Touch: pinch-zoom + pan (2 fingers), view-mode pan (1 finger) ────────
    // Uses capture phase so our handlers fire before Fabric's bubble-phase handlers.
    // stopPropagation prevents Fabric from seeing events we want to own.
    let lastPinchDistance = null;
    let lastTouchPanPoint = null;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        lastPinchDistance = getPinchDistance(e.touches);
        lastTouchPanPoint = getPinchCenter(e.touches);
      } else if (e.touches.length === 1 && isViewModeRef.current) {
        e.preventDefault();
        e.stopPropagation();
        setIsContextMenuActive(false);
        lastTouchPanPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      // Single touch in edit mode: fall through to Fabric
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        const newDistance = getPinchDistance(e.touches);
        const newCenter = getPinchCenter(e.touches);

        if (lastPinchDistance) {
          const scale = newDistance / lastPinchDistance;
          let zoom = canvas.getZoom() * scale;
          zoom = Math.min(Math.max(zoom, 0.05), 10);
          canvas.zoomToPoint(newCenter, zoom);
          setCurrentZoom(zoom * 100);
        }

        if (lastTouchPanPoint) {
          const vpt = [...canvas.viewportTransform];
          vpt[4] += newCenter.x - lastTouchPanPoint.x;
          vpt[5] += newCenter.y - lastTouchPanPoint.y;
          canvas.setViewportTransform(vpt);
        }

        lastPinchDistance = newDistance;
        lastTouchPanPoint = newCenter;
      } else if (e.touches.length === 1 && isViewModeRef.current && lastTouchPanPoint) {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        const vpt = [...canvas.viewportTransform];
        vpt[4] += touch.clientX - lastTouchPanPoint.x;
        vpt[5] += touch.clientY - lastTouchPanPoint.y;
        canvas.setViewportTransform(vpt);
        lastTouchPanPoint = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchEnd = () => {
      lastPinchDistance = null;
      lastTouchPanPoint = null;
    };

    canvas.upperCanvasEl.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    canvas.upperCanvasEl.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    canvas.upperCanvasEl.addEventListener('touchend', handleTouchEnd, { capture: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      canvas.upperCanvasEl.removeEventListener('wheel', handleWheel);
      canvas.upperCanvasEl.removeEventListener('contextmenu', handleContextMenu);
      canvas.upperCanvasEl.removeEventListener('touchstart', handleTouchStart, { capture: true });
      canvas.upperCanvasEl.removeEventListener('touchmove', handleTouchMove, { capture: true });
      canvas.upperCanvasEl.removeEventListener('touchend', handleTouchEnd, { capture: true });
      canvas.dispose();
    };
  }, [setFabricCanvas, setContextMenuPos, setIsContextMenuActive, setCurrentZoom]);

  return <canvas ref={canvasRef} className="block" />;
}
