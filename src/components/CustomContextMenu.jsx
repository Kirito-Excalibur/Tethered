export default function CustomContextMenu({ pos, clearCanvas, onClose }) {
  // Keep the menu inside the viewport — menu is ~160px wide, ~40px tall
  const x = Math.min(pos.x, window.innerWidth  - 168);
  const y = Math.min(pos.y, window.innerHeight - 48);

  return (
    <div
      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-40"
      style={{ top: y, left: x }}
    >
      <button
        onClick={() => { clearCanvas(); onClose(); }}
        className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 active:bg-gray-100 text-red-600 touch-manipulation"
      >
        Clear Canvas
      </button>
    </div>
  );
}
