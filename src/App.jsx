import { useState, useRef, useEffect, useCallback } from "react";
import CanvasManager from "./components/CanvasManager";
import Toolbar from "./components/Toolbar";
import ZoomIndicator from "./components/ZoomIndicator";
import CustomContextMenu from "./components/CustomContextMenu";
import KeyboardHandler from "./components/KeyboardHandler";
import ConnectionLayer from "./components/ConnectionLayer";
import { getStateFromURL, saveStateToURL, clearStateFromURL } from "./utils/urlState";
import { serializeCanvas, prepareFabricJSON, getConnectionsFromState, getNodeIdsFromState } from "./utils/canvasState";
import { generateId } from "./utils/connectionUtils";

const MAX_HISTORY = 50;

export default function App() {
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(100);
  const [isContextMenuActive, setIsContextMenuActive] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [isViewMode, setIsViewMode] = useState(() => !!getStateFromURL());
  const [connections, setConnections] = useState([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Mutable refs — no re-renders needed
  const connectionsRef   = useRef([]);
  const isLoadingRef     = useRef(false);  // true during URL load
  const isRestoringRef   = useRef(false);  // true during undo/redo restore
  const isViewModeRef    = useRef(isViewMode);
  const historyRef       = useRef({ stack: [], index: -1 });
  const historyTimerRef  = useRef(null);

  useEffect(() => { connectionsRef.current = connections; }, [connections]);
  useEffect(() => { isViewModeRef.current  = isViewMode;  }, [isViewMode]);

  // ── History helpers ──────────────────────────────────────────────────────

  // Immediately push a snapshot. `overrideConnections` lets callers supply
  // the updated connections list before connectionsRef has re-synced.
  // nodeIds are stored in a parallel array because Fabric 6 does not
  // reliably serialise dynamically-set properties through toJSON.
  const pushSnapshot = useCallback((overrideConnections) => {
    if (!fabricCanvas || isRestoringRef.current || isLoadingRef.current) return;
    const fabricJSON = fabricCanvas.toJSON();
    const nodeIds    = fabricCanvas.getObjects().map(obj => obj.nodeId ?? null);
    const conns      = overrideConnections ?? connectionsRef.current;
    const { stack, index } = historyRef.current;
    const newStack = [...stack.slice(0, index + 1), { fabricJSON, nodeIds, connections: conns }];
    if (newStack.length > MAX_HISTORY) newStack.shift();
    historyRef.current = { stack: newStack, index: newStack.length - 1 };
    setCanUndo(newStack.length > 1);
    setCanRedo(false);
  }, [fabricCanvas]);

  // Debounced version — safe to call from canvas events where the final
  // state might not be reached yet (e.g. mid-drag, connection cleanup).
  const scheduleSnapshot = useCallback((overrideConnections) => {
    if (isRestoringRef.current || isLoadingRef.current) return;
    clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(
      () => pushSnapshot(overrideConnections),
      250,
    );
  }, [pushSnapshot]);

  const restoreSnapshot = useCallback(async (snapshot, newIndex) => {
    if (!fabricCanvas) return;
    isRestoringRef.current = true;
    await fabricCanvas.loadFromJSON(snapshot.fabricJSON);
    // Re-apply nodeIds from the parallel array captured at snapshot time.
    // This is the only reliable way — Fabric 6 does not carry dynamic
    // properties through its own serialisation round-trip.
    fabricCanvas.getObjects().forEach((obj, i) => {
      const id = snapshot.nodeIds?.[i];
      if (id) obj.nodeId = id;
    });
    // Ensure objects are interactive in edit mode (loadFromJSON may reset
    // evented/selectable to Fabric defaults which could be overridden).
    const inEditMode = !isViewModeRef.current;
    fabricCanvas.getObjects().forEach(obj => {
      obj.evented    = inEditMode;
      obj.selectable = inEditMode;
    });
    fabricCanvas.requestRenderAll();
    setConnections(snapshot.connections);
    historyRef.current.index = newIndex;
    const len = historyRef.current.stack.length;
    setCanUndo(newIndex > 0);
    setCanRedo(newIndex < len - 1);
    // Clear the flag after React has flushed the state updates
    setTimeout(() => { isRestoringRef.current = false; }, 100);
  }, [fabricCanvas]);

  const undo = useCallback(() => {
    const { stack, index } = historyRef.current;
    if (index <= 0) return;
    restoreSnapshot(stack[index - 1], index - 1);
  }, [restoreSnapshot]);

  const redo = useCallback(() => {
    const { stack, index } = historyRef.current;
    if (index >= stack.length - 1) return;
    restoreSnapshot(stack[index + 1], index + 1);
  }, [restoreSnapshot]);

  // ── URL load ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!fabricCanvas) return;
    const state      = getStateFromURL();
    const fabricJSON = prepareFabricJSON(state);

    if (!fabricJSON) {
      // Empty canvas — seed history with a blank snapshot
      historyRef.current = {
        stack: [{ fabricJSON: fabricCanvas.toJSON(), nodeIds: [], connections: [] }],
        index: 0,
      };
      setCanUndo(false);
      setCanRedo(false);
      return;
    }

    isLoadingRef.current = true;
    fabricCanvas.loadFromJSON(fabricJSON).then(() => {
      // Restore nodeIds from the state's object array (Fabric 6 won't carry custom props through loadFromJSON).
      const savedNodeIds = getNodeIdsFromState(state);
      fabricCanvas.getObjects().forEach((obj, i) => {
        obj.nodeId = savedNodeIds[i] ?? generateId();
      });

      const conns = getConnectionsFromState(state);
      setConnections(conns);

      // Center content on screen
      const objects = fabricCanvas.getObjects();
      if (objects.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        objects.forEach(obj => {
          const b = obj.getBoundingRect();
          minX = Math.min(minX, b.left);  minY = Math.min(minY, b.top);
          maxX = Math.max(maxX, b.left + b.width);  maxY = Math.max(maxY, b.top + b.height);
        });
        const cW = maxX - minX, cH = maxY - minY, pad = 40;
        const zoom = Math.min(1,
          (fabricCanvas.width  - pad * 2) / cW,
          (fabricCanvas.height - pad * 2) / cH,
        );
        fabricCanvas.setZoom(zoom);
        fabricCanvas.viewportTransform[4] = (fabricCanvas.width  - cW * zoom) / 2 - minX * zoom;
        fabricCanvas.viewportTransform[5] = (fabricCanvas.height - cH * zoom) / 2 - minY * zoom;
        setCurrentZoom(Math.round(zoom * 100));
      }
      fabricCanvas.requestRenderAll();

      setTimeout(() => {
        isLoadingRef.current = false;
        // Seed history with the fully-loaded state
        historyRef.current = {
          stack: [{
            fabricJSON: fabricCanvas.toJSON(),
            nodeIds: fabricCanvas.getObjects().map(obj => obj.nodeId ?? null),
            connections: conns,
          }],
          index: 0,
        };
        setCanUndo(false);
        setCanRedo(false);
      }, 100);
    });
  }, [fabricCanvas]);

  // ── Canvas events → history + URL save ───────────────────────────────────

  useEffect(() => {
    if (!fabricCanvas) return;
    let urlTimer;

    const saveToURL = () => {
      if (isLoadingRef.current || isRestoringRef.current) return;
      clearTimeout(urlTimer);
      urlTimer = setTimeout(() => {
        if (isRestoringRef.current) return;
        const compact = serializeCanvas(fabricCanvas, connectionsRef.current);
        compact.o.length === 0 && connectionsRef.current.length === 0
          ? clearStateFromURL()
          : saveStateToURL(compact);
      }, 500);
    };

    const onAddedOrModified = () => { scheduleSnapshot(); saveToURL(); };

    const onRemoved = (e) => {
      if (e.target?.nodeId) {
        const id = e.target.nodeId;
        // Compute new connections now so scheduleSnapshot can capture them
        const newConns = connectionsRef.current.filter(c => c.fromId !== id && c.toId !== id);
        setConnections(newConns);
        scheduleSnapshot(newConns);
      } else {
        scheduleSnapshot();
      }
      saveToURL();
    };

    fabricCanvas.on('object:added',    onAddedOrModified);
    fabricCanvas.on('object:modified', onAddedOrModified);
    fabricCanvas.on('object:removed',  onRemoved);

    return () => {
      clearTimeout(urlTimer);
      clearTimeout(historyTimerRef.current);
      fabricCanvas.off('object:added',    onAddedOrModified);
      fabricCanvas.off('object:modified', onAddedOrModified);
      fabricCanvas.off('object:removed',  onRemoved);
    };
  }, [fabricCanvas, scheduleSnapshot]);

  // Save to URL when connections change (also covers undo/redo restoration)
  useEffect(() => {
    if (!fabricCanvas || isLoadingRef.current) return;
    const compact = serializeCanvas(fabricCanvas, connections);
    compact.o.length === 0 && connections.length === 0
      ? clearStateFromURL()
      : saveStateToURL(compact);
  }, [connections, fabricCanvas]);

  // ── Canvas / context actions ──────────────────────────────────────────────

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#f5f5f5';
    fabricCanvas.requestRenderAll();
    clearStateFromURL();
    setConnections([]);
    setIsContextMenuActive(false);
    // Clearing counts as an action — snapshot empty state
    pushSnapshot([]);
  };

  const handleShare = async () => {
    if (fabricCanvas) {
      const compact = serializeCanvas(fabricCanvas, connectionsRef.current);
      compact.o.length === 0 && connectionsRef.current.length === 0
        ? clearStateFromURL()
        : saveStateToURL(compact);
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMode = () => {
    setIsViewMode(v => !v);
    setIsContextMenuActive(false);
  };

  // ── Connection handlers ───────────────────────────────────────────────────

  const handleConnectionCreate = useCallback((conn) => {
    setConnections(prev => {
      if (prev.some(c =>
        c.fromId === conn.fromId && c.fromPort === conn.fromPort &&
        c.toId   === conn.toId   && c.toPort   === conn.toPort,
      )) return prev;
      const next = [...prev, conn];
      scheduleSnapshot(next);
      return next;
    });
  }, [scheduleSnapshot]);

  const handleConnectionDelete = useCallback((id) => {
    setConnections(prev => {
      const next = prev.filter(c => c.id !== id);
      scheduleSnapshot(next);
      return next;
    });
  }, [scheduleSnapshot]);

  const handleConnectionUpdate = useCallback((id, updates) => {
    setConnections(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      scheduleSnapshot(next);
      return next;
    });
  }, [scheduleSnapshot]);

  // ── Render ────────────────────────────────────────────────────────────────

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
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <ZoomIndicator currentZoom={currentZoom} />
      {fabricCanvas && (
        <ConnectionLayer
          canvas={fabricCanvas}
          connections={connections}
          onConnectionCreate={handleConnectionCreate}
          onConnectionUpdate={handleConnectionUpdate}
          onConnectionDelete={handleConnectionDelete}
          isViewMode={isViewMode}
        />
      )}
      {isContextMenuActive && !isViewMode && (
        <CustomContextMenu
          pos={contextMenuPos}
          clearCanvas={clearCanvas}
          onClose={() => setIsContextMenuActive(false)}
        />
      )}
      <KeyboardHandler
        fabricCanvas={fabricCanvas}
        isViewMode={isViewMode}
        onUndo={undo}
        onRedo={redo}
      />
    </div>
  );
}
