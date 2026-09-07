import { Rect, Circle, Textbox, Line } from "fabric";

const SHAPE_STYLES = {
  rect:   { fill: '#FFFFFF', stroke: '#777777', strokeWidth: 2 },
  circle: { fill: '#FFFFFF', stroke: '#777777', strokeWidth: 2 },
  text:   { fill: '#333333', backgroundColor: '', fontSize: 16, fontFamily: 'Inter, system-ui, sans-serif' },
  line:   { fill: 'transparent', stroke: '#777777', strokeWidth: 2 },
};

function getViewportCenter(canvas) {
  const zoom = canvas.getZoom();
  const vpt = canvas.viewportTransform;
  return {
    x: (canvas.width / 2 - vpt[4]) / zoom,
    y: (canvas.height / 2 - vpt[5]) / zoom,
  };
}

export default function Toolbar({ canvas, onShare, copied, isViewMode, onToggleMode }) {
  const addRectangle = () => {
    if (!canvas) return;
    const { x, y } = getViewportCenter(canvas);
    const rect = new Rect({ left: x - 60, top: y - 40, width: 120, height: 80, ...SHAPE_STYLES.rect });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
  };

  const addCircle = () => {
    if (!canvas) return;
    const { x, y } = getViewportCenter(canvas);
    const circle = new Circle({ left: x - 40, top: y - 40, radius: 40, ...SHAPE_STYLES.circle });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.requestRenderAll();
  };

  const addText = () => {
    if (!canvas) return;
    const { x, y } = getViewportCenter(canvas);
    const textbox = new Textbox('Label', {
      left: x - 50, top: y - 12, width: 100, editable: true, ...SHAPE_STYLES.text,
    });
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.requestRenderAll();
  };

  const addLine = () => {
    if (!canvas) return;
    const { x, y } = getViewportCenter(canvas);
    const line = new Line([x - 60, y, x + 60, y], { selectable: true, ...SHAPE_STYLES.line });
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.requestRenderAll();
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  };

  if (isViewMode) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-gray-800 shadow-lg rounded-xl px-2 py-1.5 flex items-center gap-1">
        <span className="text-xs text-gray-400 px-2 select-none tracking-wide">Viewing</span>
        <Divider dark />
        <DarkToolButton icon="✎" label="Edit" onClick={onToggleMode} />
        <Divider dark />
        <DarkToolButton
          icon="↗"
          label={copied ? 'Copied!' : 'Share'}
          onClick={onShare}
          highlight={copied}
        />
      </div>
    );
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-white shadow-md border border-gray-200 rounded-xl px-2 py-1.5 flex items-center gap-0.5">
      <ToolButton icon="▭" label="Box"    onClick={addRectangle} />
      <ToolButton icon="○" label="Circle" onClick={addCircle} />
      <ToolButton icon="T" label="Text"   onClick={addText} />
      <ToolButton icon="—" label="Line"   onClick={addLine} />
      <Divider />
      <ToolButton icon="✕" label="Delete" onClick={deleteSelected} variant="danger" />
      <Divider />
      <ToolButton icon="⊙" label="View"   onClick={onToggleMode} />
      <ToolButton
        icon="↗"
        label={copied ? 'Copied!' : 'Share'}
        onClick={onShare}
        variant={copied ? 'success' : 'primary'}
      />
    </div>
  );
}

function ToolButton({ icon, label, onClick, variant = 'default' }) {
  const variants = {
    default: 'hover:bg-gray-100 text-gray-600',
    danger:  'hover:bg-red-50 text-red-500',
    primary: 'hover:bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
  };
  return (
    <button
      className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none ${variants[variant]}`}
      onClick={onClick}
      title={label}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="mt-1 text-[10px]">{label}</span>
    </button>
  );
}

function DarkToolButton({ icon, label, onClick, highlight = false }) {
  return (
    <button
      className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none
        ${highlight ? 'bg-green-500/20 text-green-300' : 'hover:bg-white/10 text-gray-300'}`}
      onClick={onClick}
      title={label}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="mt-1 text-[10px]">{label}</span>
    </button>
  );
}

function Divider({ dark = false }) {
  return <div className={`w-px h-8 mx-1 ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />;
}
