export default function ZoomIndicator({ currentZoom }) {
  return (
    <div className="fixed top-2 left-2 bg-white/90 border border-gray-200 text-xs px-2.5 py-1.5 rounded-lg shadow-sm select-none pointer-events-none">
      {currentZoom.toFixed(0)}%
    </div>
  );
}
