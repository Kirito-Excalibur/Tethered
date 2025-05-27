import { Group, Rect, Textbox } from "fabric";

export default function Toolbar({ canvas }) {
 
  const addRectangle = () => {
    if (!canvas) return;

    const rect = new Rect({
      left: 50,
      top: 50,
      width: 100,
      height: 100,
      fill: "green",
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll(); // use this instead of canvas.renderAll()
  };

  //function for textbox creation
  const addTextbox = () => {
    if (!canvas) return;

    const textbox = new Textbox("Hello World", {
      left: 100,
      top: 100,
      width: 150,
      fontSize: 20,
      fontFamily: "Arial",
      padding: 0,
      strokeWidth: 10,
      borderColor: "black",
      fill:"white",
      backgroundColor:"black",
      textAlign: "center",
      editable: true,
    });
   
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.requestRenderAll(); // use this instead of canvas.renderAll()
  }


  //function to delete grouped objects
  const deleteSelectedObject = () => {
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject(); // clear selection
      canvas.requestRenderAll();
    }
  };


  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur px-4 py-2 shadow-md border rounded mt-2 flex gap-2">
      <button
        onClick={addRectangle}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        ➕ Add Rectangle
      </button>
      <button
        onClick={addTextbox}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
        ➕ Add Textbox
        </button>
        <button
        onClick={deleteSelectedObject}
        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
      >
        🗑️ Delete Selected
        </button>
    </div>
  );
}
