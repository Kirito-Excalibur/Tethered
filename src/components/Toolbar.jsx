import { useState, useRef, useEffect } from 'react';
import ShapesDropdown from './ShapesDropdown';

// Shared position: bottom on mobile, top on sm+
const TOOLBAR_POS = "toolbar-safe-bottom sm:top-3 sm:bottom-auto fixed left-1/2 -translate-x-1/2 z-50";

export default function Toolbar({ canvas, onShare, copied, isViewMode, onToggleMode }) {
  const [shapesOpen, setShapesOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close the shapes dropdown when clicking/touching outside it
  useEffect(() => {
    if (!shapesOpen) return;
    const close = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShapesOpen(false);
      }
    };
    document.addEventListener('mousedown', close, true);
    document.addEventListener('touchstart', close, true);
    return () => {
      document.removeEventListener('mousedown', close, true);
      document.removeEventListener('touchstart', close, true);
    };
  }, [shapesOpen]);

  const handleAdd = (obj) => {
    if (!canvas) return;
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    setShapesOpen(false);
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length) {
      active.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  };

  if (isViewMode) {
    return (
      <div className={`${TOOLBAR_POS} bg-gray-800 shadow-lg rounded-2xl px-1 sm:px-2 py-1 sm:py-1.5 flex items-center gap-0.5`}>
        <span className="hidden sm:block text-xs text-gray-400 px-2 select-none tracking-wide">Viewing</span>
        <div className="hidden sm:block"><Divider dark /></div>
        <DarkBtn icon="✎" label="Edit"  onClick={onToggleMode} />
        <Divider dark />
        <DarkBtn
          icon="↗"
          label={copied ? 'Copied!' : 'Share'}
          onClick={onShare}
          highlight={copied}
        />
      </div>
    );
  }

  return (
    <div className={`${TOOLBAR_POS} bg-white shadow-md border border-gray-200 rounded-2xl px-1 sm:px-2 py-1 sm:py-1.5 flex items-center gap-0.5`}>

      {/* Shapes button + dropdown */}
      <div ref={wrapperRef} className="relative">
        <Btn
          icon="+"
          label="Shapes"
          onClick={() => setShapesOpen(v => !v)}
          active={shapesOpen}
        />
        {shapesOpen && canvas && (
          <ShapesDropdown canvas={canvas} onAdd={handleAdd} />
        )}
      </div>

      <Divider />
      <Btn icon="✕" label="Delete" onClick={deleteSelected} variant="danger" />
      <Divider />
      <Btn icon="⊙" label="View"   onClick={onToggleMode} />
      <Btn
        icon="↗"
        label={copied ? 'Copied!' : 'Share'}
        onClick={onShare}
        variant={copied ? 'success' : 'primary'}
      />
    </div>
  );
}

function Btn({ icon, label, onClick, variant = 'default', active = false }) {
  const variants = {
    default: 'hover:bg-gray-100 active:bg-gray-200 text-gray-600',
    danger:  'hover:bg-red-50  active:bg-red-100  text-red-500',
    primary: 'hover:bg-blue-50 active:bg-blue-100 text-blue-600',
    success: 'bg-green-50 text-green-600',
  };
  return (
    <button
      className={`flex flex-col items-center justify-center touch-manipulation
                  w-10 h-10 sm:w-12 sm:h-12 rounded-xl
                  text-xs font-medium transition-colors cursor-pointer select-none
                  ${active ? 'bg-gray-100' : ''} ${variants[variant]}`}
      onClick={onClick}
      title={label}
    >
      <span className="text-lg sm:text-base leading-none">{icon}</span>
      <span className="hidden sm:block mt-1 text-[10px]">{label}</span>
    </button>
  );
}

function DarkBtn({ icon, label, onClick, highlight = false }) {
  return (
    <button
      className={`flex flex-col items-center justify-center touch-manipulation
                  w-10 h-10 sm:w-12 sm:h-12 rounded-xl
                  text-xs font-medium transition-colors cursor-pointer select-none
                  ${highlight ? 'bg-green-500/20 text-green-300' : 'hover:bg-white/10 active:bg-white/20 text-gray-300'}`}
      onClick={onClick}
      title={label}
    >
      <span className="text-lg sm:text-base leading-none">{icon}</span>
      <span className="hidden sm:block mt-1 text-[10px]">{label}</span>
    </button>
  );
}

function Divider({ dark = false }) {
  return <div className={`w-px h-6 sm:h-8 mx-0.5 sm:mx-1 ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />;
}
