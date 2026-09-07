import { useEffect, useRef } from "react";
import { Canvas } from "fabric";

export default function CanvasManager({ setFabricCanvas, setContextMenuPos, setIsContextMenuActive, setCurrentZoom }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#f5f5f5',
    });

    setFabricCanvas(canvas);

    let isPanning = false;
    let isEditingText = false;
    let lastPanPoint = null;

    const handleResize = () => {
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(window.innerHeight);
      canvas.requestRenderAll();
    };
    window.addEventListener('resize', handleResize);

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' && !isEditingText) {
        e.preventDefault();
        isPanning = true;
        canvas.defaultCursor = 'grab';
        canvas.setCursor('grab');
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        isPanning = false;
        canvas.isDragging = false;
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.setCursor('default');
        lastPanPoint = null;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    canvas.on('mouse:down', (opt) => {
      const e = opt.e;
      const isMiddleClick = e.button === 1;

      if (isPanning || isMiddleClick) {
        canvas.isDragging = true;
        canvas.selection = false;
        lastPanPoint = { x: e.clientX, y: e.clientY };
        if (isMiddleClick) e.preventDefault();
      }

      if (e.button === 0) {
        setIsContextMenuActive(false);
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (canvas.isDragging && lastPanPoint) {
        const e = opt.e;
        const vpt = [...canvas.viewportTransform];
        vpt[4] += e.clientX - lastPanPoint.x;
        vpt[5] += e.clientY - lastPanPoint.y;
        canvas.setViewportTransform(vpt);
        lastPanPoint = { x: e.clientX, y: e.clientY };
        canvas.setCursor(isPanning ? 'grabbing' : 'default');
      }
    });

    canvas.on('mouse:up', () => {
      canvas.isDragging = false;
      if (!isPanning) {
        canvas.selection = true;
      }
      if (isPanning) {
        canvas.setCursor('grab');
      }
      lastPanPoint = null;
    });

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

    const handleContextMenu = (e) => {
      e.preventDefault();
      setContextMenuPos({ x: e.clientX, y: e.clientY });
      setIsContextMenuActive(true);
    };
    canvas.upperCanvasEl.addEventListener('contextmenu', handleContextMenu);

    canvas.on('text:editing:entered', () => { isEditingText = true; });
    canvas.on('text:editing:exited', () => { isEditingText = false; });

    canvas.on('selection:created', (event) => {
      event.selected?.forEach(obj => {
        if (obj.type === 'textbox') {
          obj.set({ backgroundColor: 'rgba(59, 130, 246, 0.08)' });
        }
      });
      canvas.requestRenderAll();
    });

    canvas.on('selection:cleared', (event) => {
      event.deselected?.forEach(obj => {
        if (obj.type === 'textbox') {
          obj.set({ backgroundColor: '' });
        }
      });
      canvas.requestRenderAll();
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      canvas.upperCanvasEl.removeEventListener('wheel', handleWheel);
      canvas.upperCanvasEl.removeEventListener('contextmenu', handleContextMenu);
      canvas.dispose();
    };
  }, [setFabricCanvas, setContextMenuPos, setIsContextMenuActive, setCurrentZoom]);

  return <canvas ref={canvasRef} className="block" />;
}
