export default function ZoomIndicator({ currentZoom }) {
  return (
    <div
      id="zoom-indicator"
      className="absolute top-2 left-2 bg-white border border-gray-300 text-sm px-3 py-1 rounded shadow-md select-none"
    >
      {currentZoom.toFixed(0)}%
    </div>
  );
}