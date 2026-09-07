export default function CustomContextMenu({ pos, clearCanvas, onClose }) {
  return (
    <div
      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
      style={{ top: pos.y, left: pos.x }}
    >
      <button
        onClick={() => { clearCanvas(); onClose(); }}
        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
      >
        Clear Canvas
      </button>
    </div>
  );
}
