import { Rect } from 'fabric';

export default function Toolbar({ canvas }) {
  const addRectangle = () => {
    if (!canvas) return;

    const rect = new Rect({
      left: 50,
      top: 50,
      width: 100,
      height: 100,
      fill: 'green',
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll(); // use this instead of canvas.renderAll()
  };

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur px-4 py-2 shadow-md border rounded mt-2 flex gap-2">
      <button
        onClick={addRectangle}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        ➕ Add Rectangle
      </button>
    </div>
  );
}
