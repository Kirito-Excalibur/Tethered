import { Rect, Circle, Textbox, Line, Triangle, Polygon, Path } from 'fabric';
import { generateId } from '../utils/connectionUtils';

const WIRE = { fill: '#FFFFFF', stroke: '#777777', strokeWidth: 2 };

const ARROW_PATH = 'M 0 15 L 50 15 L 50 0 L 80 20 L 50 40 L 50 25 L 0 25 Z';

function makeStar(cx, cy) {
  const R = 40, r = 16, n = 5;
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI / n) - Math.PI / 2;
    const radius = i % 2 === 0 ? R : r;
    pts.push({ x: R + radius * Math.cos(a), y: R + radius * Math.sin(a) });
  }
  const xs = pts.map(p => p.x);
  const ys = pts.map(p => p.y);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  return new Polygon(pts, { left: cx - w / 2, top: cy - h / 2, ...WIRE });
}

// Each entry: { icon, label, create(cx, cy) → FabricObject }
const SHAPES = [
  {
    icon: '▭', label: 'Box',
    create: (x, y) => new Rect({ left: x - 60, top: y - 40, width: 120, height: 80, ...WIRE }),
  },
  {
    icon: '○', label: 'Circle',
    create: (x, y) => new Circle({ left: x - 40, top: y - 40, radius: 40, ...WIRE }),
  },
  {
    icon: '△', label: 'Triangle',
    create: (x, y) => new Triangle({ left: x - 50, top: y - 43, width: 100, height: 86, ...WIRE }),
  },
  {
    icon: '★', label: 'Star',
    create: (x, y) => makeStar(x, y),
  },
  {
    icon: '→', label: 'Arrow',
    create: (x, y) => new Path(ARROW_PATH, { left: x - 40, top: y - 20, ...WIRE }),
  },
  {
    icon: 'T', label: 'Text',
    create: (x, y) => new Textbox('Label', {
      left: x - 50, top: y - 12, width: 100, editable: true,
      fill: '#333333', backgroundColor: '', fontSize: 16,
      fontFamily: 'Inter, system-ui, sans-serif',
    }),
  },
  {
    icon: '—', label: 'Line',
    create: (x, y) => new Line([x - 60, y, x + 60, y], {
      selectable: true, fill: 'transparent', stroke: '#777777', strokeWidth: 2,
    }),
  },
];

export default function ShapesDropdown({ canvas, onAdd }) {
  const vpCenter = () => {
    const zoom = canvas.getZoom();
    const vpt  = canvas.viewportTransform;
    return {
      x: (canvas.width  / 2 - vpt[4]) / zoom,
      y: (canvas.height / 2 - vpt[5]) / zoom,
    };
  };

  return (
    // Mobile  (bottom toolbar): opens upward  — bottom-full mb-2
    // Desktop (top    toolbar): opens downward — sm:top-full sm:mt-2
    <div className="shapes-dropdown absolute bg-white border border-gray-200 rounded-2xl shadow-xl p-2 gap-1 z-[60]">
      {SHAPES.map(({ icon, label, create }) => (
        <button
          key={label}
          onClick={() => {
            const { x, y } = vpCenter();
            const obj = create(x, y);
            obj.nodeId = generateId();
            onAdd(obj);
          }}
          className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-xl hover:bg-gray-100 active:bg-gray-200 text-gray-600 transition-colors touch-manipulation select-none"
          title={label}
        >
          <span className="text-xl leading-none">{icon}</span>
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
