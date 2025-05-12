import { useEffect, useState } from 'react';

export default function Sidebar({ canvas }) {
  const [objects, setObjects] = useState([]);

  useEffect(() => {
    if (!canvas) return;

    const updateObjects = () => {
      const objs = canvas.getObjects().map((obj, index) => ({
        id: obj.id || index,
        type: obj.type,
        left: Math.round(obj.left),
        top: Math.round(obj.top),
        width: Math.round(obj.width * obj.scaleX),
        height: Math.round(obj.height * obj.scaleY),
      }));
      setObjects(objs);
    };

    updateObjects();
    canvas.on('object:added', updateObjects);
    canvas.on('object:modified', updateObjects);
    canvas.on('object:removed', updateObjects);

    return () => {
      canvas.off('object:added', updateObjects);
      canvas.off('object:modified', updateObjects);
      canvas.off('object:removed', updateObjects);
    };
  }, [canvas]);

  return (
    <div className="p-4 w-64 h-screen overflow-y-auto bg-gray-100 border-r absolute">
      <h2 className="text-lg font-semibold mb-2">Objects on Canvas</h2>
      <ul className="space-y-2">
        {objects.map(obj => (
          <li key={obj.id} className="text-sm border rounded p-2 bg-white">
            <div>🧱 <strong>{obj.type}</strong></div>
            <div>📍 ({obj.left}, {obj.top})</div>
            <div>📐 {obj.width} × {obj.height}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
