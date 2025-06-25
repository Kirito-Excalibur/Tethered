export default function CustomContextMenu({ menuLeft, menuTop, clearCanvas }) {
  return (
    <div
      className="absolute bg-white border border-gray-300 rounded shadow-md p-2"
      style={{ top: menuTop, left: menuLeft }}
    >
      <button
        onClick={clearCanvas}
        className="block w-full text-left px-2 py-1 hover:bg-gray-100"
      >
        Clear Canvas
      </button>
      {/* Add more menu items here */}
    </div>
  );
}