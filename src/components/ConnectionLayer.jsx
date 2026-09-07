import { useState, useEffect, useRef, useCallback } from 'react';
import {
  generateId,
  getPortsInScreen, canvasToScreen, screenToCanvas,
  bezierPath, bezierMidpoint,
  closestPort, OPPOSITE,
} from '../utils/connectionUtils';

const PORT_KEYS       = ['n', 'e', 's', 'w'];
const PORT_R          = 6;   // port circle radius
const PORT_SNAP_R     = 9;   // snapped-target radius
const PORT_SNAP_DIST  = 24;  // px within which a port snaps
const MID_HALF        = 6;   // half-size of the mid diamond

function diamond(cx, cy, s) {
  return `M ${cx} ${cy - s} L ${cx + s} ${cy} L ${cx} ${cy + s} L ${cx - s} ${cy} Z`;
}

export default function ConnectionLayer({
  canvas,
  connections,
  onConnectionCreate,
  onConnectionUpdate,
  onConnectionDelete,
  isViewMode,
}) {
  const [hoveredNodeId,        setHoveredNodeId]        = useState(null);
  const [hoveredConnectionId,  setHoveredConnectionId]  = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  // activeDrag: null | { type:'port', fromNodeId, fromPort, x, y, targetNodeId, targetPort }
  //                   | { type:'mid',  connectionId, x, y }
  const [activeDrag, setActiveDrag] = useState(null);
  const [tick, setTick] = useState(0); // eslint-disable-line no-unused-vars

  const clearHoverTimer = useRef(null);
  const activeDragRef   = useRef(null);
  const svgRef          = useRef(null);

  useEffect(() => { activeDragRef.current = activeDrag; }, [activeDrag]);

  // Re-render after every canvas redraw (shape move, zoom, pan)
  useEffect(() => {
    if (!canvas) return;
    let rafId;
    const onRender = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setTick(t => t + 1));
    };
    canvas.on('after:render', onRender);
    return () => { canvas.off('after:render', onRender); cancelAnimationFrame(rafId); };
  }, [canvas]);

  // Show port handles when hovering a shape
  useEffect(() => {
    if (!canvas) return;
    const onOver = ({ target }) => {
      if (!target?.nodeId) return;
      clearTimeout(clearHoverTimer.current);
      setHoveredNodeId(target.nodeId);
    };
    const onOut = () => {
      clearHoverTimer.current = setTimeout(() => setHoveredNodeId(null), 80);
    };
    canvas.on('mouse:over', onOver);
    canvas.on('mouse:out',  onOut);
    return () => {
      canvas.off('mouse:over', onOver);
      canvas.off('mouse:out',  onOut);
      clearTimeout(clearHoverTimer.current);
    };
  }, [canvas]);

  // Delete selected connection via keyboard
  useEffect(() => {
    if (!selectedConnectionId) return;
    const onKey = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        onConnectionDelete(selectedConnectionId);
        setSelectedConnectionId(null);
      } else if (e.key === 'Escape') {
        setSelectedConnectionId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedConnectionId, onConnectionDelete]);

  // nodeId → Fabric object map
  const shapeMap = {};
  if (canvas) {
    for (const obj of canvas.getObjects()) {
      if (obj.nodeId) shapeMap[obj.nodeId] = obj;
    }
  }

  // ── Mouse handlers on the SVG overlay ────────────────────────────────────

  const onSvgMouseMove = useCallback((e) => {
    const d = activeDragRef.current;
    if (!d || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (d.type === 'port') {
      if (!canvas) return;
      let targetNodeId = null, targetPort = null;
      for (const obj of canvas.getObjects()) {
        if (!obj.nodeId || obj.nodeId === d.fromNodeId) continue;
        const p = closestPort(getPortsInScreen(obj, canvas), x, y, PORT_SNAP_DIST);
        if (p) { targetNodeId = obj.nodeId; targetPort = p; break; }
      }
      setActiveDrag(prev => ({ ...prev, x, y, targetNodeId, targetPort }));
    } else if (d.type === 'mid') {
      setActiveDrag(prev => ({ ...prev, x, y }));
    }
  }, [canvas]);

  const onSvgMouseUp = useCallback(() => {
    const d = activeDragRef.current;
    if (!d) return;

    if (d.type === 'port' && d.targetNodeId && d.targetPort) {
      onConnectionCreate({
        id: generateId(),
        fromId: d.fromNodeId, fromPort: d.fromPort,
        toId:   d.targetNodeId, toPort: d.targetPort,
        mid: null,
      });
    } else if (d.type === 'mid' && canvas) {
      onConnectionUpdate(d.connectionId, { mid: screenToCanvas({ x: d.x, y: d.y }, canvas) });
    }
    setActiveDrag(null);
  }, [canvas, onConnectionCreate, onConnectionUpdate]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const showPortsFor = new Set();
  if (!isViewMode) {
    if (hoveredNodeId && shapeMap[hoveredNodeId]) showPortsFor.add(hoveredNodeId);
    if (activeDrag?.type === 'port') Object.keys(shapeMap).forEach(id => showPortsFor.add(id));
  }

  const isDragging = activeDrag !== null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 40, pointerEvents: isDragging ? 'all' : 'none' }}
      onMouseMove={isDragging ? onSvgMouseMove : undefined}
      onMouseUp={isDragging ? onSvgMouseUp : undefined}
      onMouseLeave={isDragging ? onSvgMouseUp : undefined}
    >
      <defs>
        <marker id="ca"     markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0,8 3,0 6" fill="#6366f1" />
        </marker>
        <marker id="ca-sel" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0,8 3,0 6" fill="#ef4444" />
        </marker>
        <marker id="ca-pre" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0,8 3,0 6" fill="#94a3b8" />
        </marker>
      </defs>

      {/* ── Permanent connections ─────────────────────────────────────── */}
      {connections.map(conn => {
        const fromObj = shapeMap[conn.fromId];
        const toObj   = shapeMap[conn.toId];
        if (!fromObj || !toObj) return null;

        const fp = getPortsInScreen(fromObj, canvas)[conn.fromPort];
        const tp = getPortsInScreen(toObj,   canvas)[conn.toPort];
        if (!fp || !tp) return null;

        // If the mid handle for this connection is being dragged, use live position
        const liveMidScreen =
          activeDrag?.type === 'mid' && activeDrag.connectionId === conn.id
            ? { x: activeDrag.x, y: activeDrag.y }
            : conn.mid ? canvasToScreen(conn.mid, canvas) : null;

        const pathD = bezierPath(fp, conn.fromPort, tp, conn.toPort, liveMidScreen);
        const sel   = conn.id === selectedConnectionId;
        const hov   = conn.id === hoveredConnectionId;

        // Mid handle: solid if user-placed, ghost if just hovering/selected
        const showMid = !isViewMode && (hov || sel || conn.mid != null);
        const midScreen =
          liveMidScreen ??
          (showMid ? bezierMidpoint(fp, conn.fromPort, tp, conn.toPort) : null);

        return (
          <g key={conn.id}>
            {/* Hit zone */}
            <path
              d={pathD} fill="none" stroke="transparent" strokeWidth={16}
              style={{ pointerEvents: 'all', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredConnectionId(conn.id)}
              onMouseLeave={() => setHoveredConnectionId(null)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedConnectionId(sel ? null : conn.id);
              }}
            />
            {/* Visible line */}
            <path
              d={pathD} fill="none"
              stroke={sel ? '#ef4444' : '#6366f1'}
              strokeWidth={sel ? 2.5 : 2}
              markerEnd={sel ? 'url(#ca-sel)' : 'url(#ca)'}
              style={{ pointerEvents: 'none' }}
            />
            {/* Mid-point bend handle */}
            {showMid && midScreen && (
              <path
                d={diamond(midScreen.x, midScreen.y, MID_HALF)}
                fill={conn.mid ? '#6366f1' : '#ffffff'}
                stroke="#6366f1"
                strokeWidth={1.5}
                style={{ pointerEvents: 'all', cursor: 'move' }}
                onMouseEnter={() => { setHoveredConnectionId(conn.id); clearTimeout(clearHoverTimer.current); }}
                onMouseLeave={() => setHoveredConnectionId(null)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = svgRef.current.getBoundingClientRect();
                  setActiveDrag({
                    type: 'mid',
                    connectionId: conn.id,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onConnectionUpdate(conn.id, { mid: null });
                }}
              />
            )}
          </g>
        );
      })}

      {/* ── Delete badge on selected connection ──────────────────────── */}
      {selectedConnectionId && !isViewMode && (() => {
        const conn    = connections.find(c => c.id === selectedConnectionId);
        const fromObj = conn && shapeMap[conn.fromId];
        const toObj   = conn && shapeMap[conn.toId];
        if (!fromObj || !toObj) return null;
        const fp  = getPortsInScreen(fromObj, canvas)[conn.fromPort];
        const tp  = getPortsInScreen(toObj,   canvas)[conn.toPort];
        const mid = conn.mid ? canvasToScreen(conn.mid, canvas) : null;
        const mx  = mid ? mid.x : (fp.x + tp.x) / 2;
        const my  = mid ? mid.y : (fp.y + tp.y) / 2;
        return (
          <g style={{ pointerEvents: 'all' }}>
            <rect x={mx - 34} y={my - 12} width={68} height={24} rx={6} fill="#ef4444"
              style={{ cursor: 'pointer' }}
              onClick={() => { onConnectionDelete(selectedConnectionId); setSelectedConnectionId(null); }}
            />
            <text x={mx} y={my + 5} textAnchor="middle" fill="white"
              fontSize={11} fontFamily="system-ui,sans-serif"
              style={{ pointerEvents: 'none', userSelect: 'none' }}>
              Delete (⌫)
            </text>
          </g>
        );
      })()}

      {/* ── Preview line while dragging a port ───────────────────────── */}
      {activeDrag?.type === 'port' && (() => {
        const fromObj = shapeMap[activeDrag.fromNodeId];
        if (!fromObj) return null;
        const fp = getPortsInScreen(fromObj, canvas)[activeDrag.fromPort];
        let to     = { x: activeDrag.x, y: activeDrag.y };
        let toPort = OPPOSITE[activeDrag.fromPort];
        if (activeDrag.targetNodeId && activeDrag.targetPort) {
          const tObj = shapeMap[activeDrag.targetNodeId];
          if (tObj) { to = getPortsInScreen(tObj, canvas)[activeDrag.targetPort]; toPort = activeDrag.targetPort; }
        }
        return (
          <path
            d={bezierPath(fp, activeDrag.fromPort, to, toPort)}
            fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 4"
            markerEnd="url(#ca-pre)"
          />
        );
      })()}

      {/* ── Port handles on hovered / dragging shapes ────────────────── */}
      {!isViewMode && [...showPortsFor].flatMap(nodeId => {
        const obj = shapeMap[nodeId];
        if (!obj) return [];
        const ports = getPortsInScreen(obj, canvas);
        return PORT_KEYS.map(port => {
          const pt       = ports[port];
          const isSnap   = activeDrag?.type === 'port' && activeDrag.targetNodeId === nodeId && activeDrag.targetPort === port;
          const isSource = activeDrag?.type === 'port' && activeDrag.fromNodeId   === nodeId && activeDrag.fromPort   === port;
          return (
            <circle
              key={`${nodeId}-${port}`}
              cx={pt.x} cy={pt.y}
              r={isSnap ? PORT_SNAP_R : PORT_R}
              fill={isSnap || isSource ? '#6366f1' : '#ffffff'}
              stroke={isSnap ? '#6366f1' : '#94a3b8'}
              strokeWidth={2}
              style={{ pointerEvents: 'all', cursor: 'crosshair' }}
              onMouseEnter={() => { clearTimeout(clearHoverTimer.current); setHoveredNodeId(nodeId); }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = svgRef.current.getBoundingClientRect();
                setActiveDrag({
                  type: 'port',
                  fromNodeId: nodeId, fromPort: port,
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  targetNodeId: null, targetPort: null,
                });
              }}
            />
          );
        });
      })}
    </svg>
  );
}
