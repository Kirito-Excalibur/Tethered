// Fabric includes these in every object's toJSON() but they're constants we never change.
const ALWAYS_STRIP = new Set([
  'version', 'originX', 'originY',
  'strokeDashArray', 'strokeLineCap', 'strokeDashOffset', 'strokeLineJoin',
  'strokeUniform', 'strokeMiterLimit',
  'fillRule', 'paintFirst', 'globalCompositeOperation',
  'shadow', 'visible', 'selectable', 'evented',
  'hasControls', 'hasBorders', 'lockMovementX', 'lockMovementY',
  'flipX', 'flipY', 'skewX', 'skewY',
  'backgroundColor',        // dynamic selection highlight — never persisted
  'textBackgroundColor', 'underline', 'overline', 'linethrough',
  'direction', 'pathStartOffset', 'pathSide', 'pathAlign',
  'splitByGrapheme', 'lockScalingFlip', 'charSpacing',
  'minWidth', 'dynamicMinWidth', 'editable', 'padding',
]);

// Strip only when value equals the Fabric default.
const STRIP_IF_DEFAULT = {
  opacity: 1, angle: 0, scaleX: 1, scaleY: 1,
  rx: 0, ry: 0,
  lineHeight: 1.16, textAlign: 'left',
  fontWeight: 'normal', fontStyle: 'normal',
};

// Long key → short key
const TO_SHORT = {
  type: 'ty', left: 'l',  top: 'p',  width: 'w', height: 'h',
  fill: 'f',  stroke: 's', strokeWidth: 'sw',
  radius: 'r', text: 'tx', fontSize: 'fz', fontFamily: 'ff',
  fontWeight: 'fw', fontStyle: 'fi', textAlign: 'ta', lineHeight: 'lh',
  x1: 'x1',  y1: 'y1',  x2: 'x2',  y2: 'y2',
  scaleX: 'sx', scaleY: 'sy', angle: 'ag', opacity: 'op',
  styles: 'cs',
};
const FROM_SHORT = Object.fromEntries(Object.entries(TO_SHORT).map(([k, v]) => [v, k]));

// Shape type → single/two char tag
const TYPE_TO_SHORT   = { rect: 'r', circle: 'c', textbox: 'x', line: 'ln' };
const TYPE_FROM_SHORT = Object.fromEntries(Object.entries(TYPE_TO_SHORT).map(([k, v]) => [v, k]));

function isEmptyStyles(val) {
  if (!val) return true;
  if (Array.isArray(val)) return val.length === 0;
  return typeof val === 'object' && Object.keys(val).length === 0;
}

function compressObject(obj) {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (ALWAYS_STRIP.has(key)) continue;
    if (key in STRIP_IF_DEFAULT && val === STRIP_IF_DEFAULT[key]) continue;
    if (key === 'styles' && isEmptyStyles(val)) continue;
    const shortKey = TO_SHORT[key] ?? key;
    result[shortKey] = key === 'type' ? (TYPE_TO_SHORT[val] ?? val) : val;
  }
  return result;
}

function expandObject(obj) {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = FROM_SHORT[key] ?? key;
    result[fullKey] = fullKey === 'type' ? (TYPE_FROM_SHORT[val] ?? val) : val;
  }
  return result;
}

// Serialize canvas objects into our compact format.
export function serializeCanvas(canvas) {
  const json = canvas.toJSON();
  return { v: 1, o: json.objects.map(compressObject) };
}

// Convert stored state → Fabric-compatible JSON for loadFromJSON.
// Handles both the new compact format and old raw Fabric JSON (backward compat).
export function prepareFabricJSON(state) {
  if (!state) return null;
  if (state.v === 1) return { objects: state.o.map(expandObject) };
  if (state.objects) return state;   // old format
  return null;
}
