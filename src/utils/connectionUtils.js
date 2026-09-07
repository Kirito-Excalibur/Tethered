export function generateId() {
  return Math.random().toString(36).slice(2, 8);
}

const PORT_DIR = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
export const OPPOSITE = { n: 's', s: 'n', e: 'w', w: 'e' };

// Canvas (world) coords → SVG/screen coords
export function canvasToScreen(pt, canvas) {
  const zoom = canvas.getZoom();
  const vpt  = canvas.viewportTransform;
  return { x: pt.x * zoom + vpt[4], y: pt.y * zoom + vpt[5] };
}

// SVG/screen coords → canvas (world) coords
export function screenToCanvas(pt, canvas) {
  const zoom = canvas.getZoom();
  const vpt  = canvas.viewportTransform;
  return { x: (pt.x - vpt[4]) / zoom, y: (pt.y - vpt[5]) / zoom };
}

/**
 * Port positions for a Fabric object in SVG/screen coordinates.
 */
export function getPortsInScreen(obj, canvas) {
  const m  = obj.calcTransformMatrix();
  const w2 = obj.width  / 2;
  const h2 = obj.height / 2;
  const zoom = canvas.getZoom();
  const vpt  = canvas.viewportTransform;

  const toScreen = (ox, oy) => {
    const cx = m[0] * ox + m[2] * oy + m[4];
    const cy = m[1] * ox + m[3] * oy + m[5];
    return { x: cx * zoom + vpt[4], y: cy * zoom + vpt[5] };
  };

  return {
    n: toScreen(0,  -h2),
    s: toScreen(0,   h2),
    e: toScreen(w2,  0),
    w: toScreen(-w2, 0),
  };
}

/**
 * Cubic bezier path between two port screen positions.
 * When `mid` (screen coords) is provided the path runs as two segments
 * that smoothly pass through the midpoint.
 */
export function bezierPath(from, fromPort, to, toPort, mid = null) {
  const [fdx, fdy] = PORT_DIR[fromPort] || [0, -1];
  const [tdx, tdy] = PORT_DIR[toPort]   || [0,  1];

  if (!mid) {
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const cp   = Math.max(Math.min(dist * 0.45, 150), 40);
    return (
      `M ${from.x} ${from.y} ` +
      `C ${from.x + fdx * cp} ${from.y + fdy * cp}, ` +
      `${to.x + tdx * cp} ${to.y + tdy * cp}, ` +
      `${to.x} ${to.y}`
    );
  }

  // Two-segment bezier that passes through `mid`.
  // Compute a smooth tangent at mid = average of (from→mid) and (mid→to) unit vectors.
  const dist1 = Math.hypot(mid.x - from.x, mid.y - from.y) || 1;
  const dist2 = Math.hypot(to.x  - mid.x,  to.y  - mid.y)  || 1;

  const n1x = (mid.x - from.x) / dist1,  n1y = (mid.y - from.y) / dist1;
  const n2x = (to.x  - mid.x)  / dist2,  n2y = (to.y  - mid.y)  / dist2;
  const tlen = Math.hypot(n1x + n2x, n1y + n2y) || 1;
  const tx = (n1x + n2x) / tlen,  ty = (n1y + n2y) / tlen;

  const cp1 = Math.max(Math.min(dist1 * 0.5, 120), 25);
  const cp2 = Math.max(Math.min(dist2 * 0.5, 120), 25);
  const cpM = Math.max(Math.min(Math.min(dist1, dist2) * 0.35, 80), 15);

  return (
    `M ${from.x} ${from.y} ` +
    `C ${from.x + fdx * cp1} ${from.y + fdy * cp1}, ` +
    `${mid.x - tx * cpM} ${mid.y - ty * cpM}, ` +
    `${mid.x} ${mid.y} ` +
    `C ${mid.x + tx * cpM} ${mid.y + ty * cpM}, ` +
    `${to.x + tdx * cp2} ${to.y + tdy * cp2}, ` +
    `${to.x} ${to.y}`
  );
}

/**
 * Point on a bezier at t=0.5 — used as the default position for the mid handle
 * before the user drags it.
 */
export function bezierMidpoint(from, fromPort, to, toPort) {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const cp   = Math.max(Math.min(dist * 0.45, 150), 40);
  const [fdx, fdy] = PORT_DIR[fromPort] || [0, -1];
  const [tdx, tdy] = PORT_DIR[toPort]   || [0,  1];
  const p1 = { x: from.x + fdx * cp, y: from.y + fdy * cp };
  const p2 = { x: to.x   + tdx * cp, y: to.y   + tdy * cp };
  // Cubic bezier at t = 0.5: (p0 + 3p1 + 3p2 + p3) / 8
  return {
    x: (from.x + 3 * p1.x + 3 * p2.x + to.x) / 8,
    y: (from.y + 3 * p1.y + 3 * p2.y + to.y) / 8,
  };
}

/**
 * Closest port within `threshold` pixels of screen point (x, y).
 */
export function closestPort(ports, x, y, threshold = 20) {
  let best = null, bestDist = threshold;
  for (const [port, pt] of Object.entries(ports)) {
    const d = Math.hypot(pt.x - x, pt.y - y);
    if (d < bestDist) { best = port; bestDist = d; }
  }
  return best;
}
