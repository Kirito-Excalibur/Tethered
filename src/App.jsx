import { useState, useRef, useEffect } from "react";
import CanvasManager from "./components/CanvasManager";
import Toolbar from "./components/Toolbar";
import ZoomIndicator from "./components/ZoomIndicator";
import CustomContextMenu from "./components/CustomContextMenu";
import KeyboardHandler from "./components/KeyboardHandler";
import { getStateFromURL, saveStateToURL, clearStateFromURL } from "./utils/urlState";
import { serializeCanvas, prepareFabricJSON } from "./utils/canvasState";

export default function App() {
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(100);
  const [isContextMenuActive, setIsContextMenuActive] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [isViewMode, setIsViewMode] = useState(() => !!getStateFromURL());
  const isLoadingRef = useRef(false);

  // Load state from URL when canvas is ready
  useEffect(() => {
    if (!fabricCanvas) return;
    const fabricJSON = prepareFabricJSON(getStateFromURL());
    if (!fabricJSON) return;
    isLoadingRef.current = true;
    fabricCanvas.loadFromJSON(fabricJSON).then(() => {
      // Center viewport on the loaded content
      const objects = fabricCanvas.getObjects();
      if (objects.length > 0) {
        // Compute bounding box of all objects in canvas coordinates
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        objects.forEach(obj => {
          const bounds = obj.getBoundingRect();
          minX = Math.min(minX, bounds.left);
          minY = Math.min(minY, bounds.top);
          maxX = Math.max(maxX, bounds.left + bounds.width);
          maxY = Math.max(maxY, bounds.top + bounds.height);
        });
        const contentW = maxX - minX;
        const contentH = maxY - minY;
        // Fit with padding, capped at 100% zoom
        const padding = 40;
        const zoom = Math.min(
          1,
          (fabricCanvas.width  - padding * 2) / contentW,
          (fabricCanvas.height - padding * 2) / contentH,
        );
        const panX = (fabricCanvas.width  - contentW * zoom) / 2 - minX * zoom;
        const panY = (fabricCanvas.height - contentH * zoom) / 2 - minY * zoom;
        fabricCanvas.setZoom(zoom);
        fabricCanvas.viewportTransform[4] = panX;
        fabricCanvas.viewportTransform[5] = panY;
        setCurrentZoom(Math.round(zoom * 100));
      }
      fabricCanvas.requestRenderAll();
      setTimeout(() => { isLoadingRef.current = false; }, 100);
    });
  }, [fabricCanvas]);

  // Auto-save canvas state to URL on changes
  useEffect(() => {
    if (!fabricCanvas) return;
    let timer;

    const saveToURL = () => {
      if (isLoadingRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const compact = serializeCanvas(fabricCanvas);
        if (!compact.o || compact.o.length === 0) {
          clearStateFromURL();
        } else {
          saveStateToURL(compact);
        }
      }, 500);
    };

    fabricCanvas.on('object:added', saveToURL);
    fabricCanvas.on('object:modified', saveToURL);
    fabricCanvas.on('object:removed', saveToURL);

    return () => {
      clearTimeout(timer);
      fabricCanvas.off('object:added', saveToURL);
      fabricCanvas.off('object:modified', saveToURL);
      fabricCanvas.off('object:removed', saveToURL);
    };
  }, [fabricCanvas]);

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#f5f5f5';
    fabricCanvas.requestRenderAll();
    clearStateFromURL();
    setIsContextMenuActive(false);
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMode = () => {
    setIsViewMode(v => !v);
    setIsContextMenuActive(false);
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <CanvasManager
        setFabricCanvas={setFabricCanvas}
        setContextMenuPos={setContextMenuPos}
        setIsContextMenuActive={setIsContextMenuActive}
        setCurrentZoom={setCurrentZoom}
        isViewMode={isViewMode}
      />
      <Toolbar
        canvas={fabricCanvas}
        onShare={handleShare}
        copied={copied}
        isViewMode={isViewMode}
        onToggleMode={toggleMode}
      />
      <ZoomIndicator currentZoom={currentZoom} />
      {isContextMenuActive && !isViewMode && (
        <CustomContextMenu
          pos={contextMenuPos}
          clearCanvas={clearCanvas}
          onClose={() => setIsContextMenuActive(false)}
        />
      )}
      <KeyboardHandler fabricCanvas={fabricCanvas} isViewMode={isViewMode} />
    </div>
  );
}
