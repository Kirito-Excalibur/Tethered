import { useEffect } from "react";

export default function KeyboardHandler({ fabricCanvas, isViewMode }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!fabricCanvas || isViewMode) return;
      const activeObj = fabricCanvas.getActiveObject();
      if (activeObj?.isEditing) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObjects = fabricCanvas.getActiveObjects();
        if (activeObjects.length) {
          activeObjects.forEach(obj => fabricCanvas.remove(obj));
          fabricCanvas.discardActiveObject();
          fabricCanvas.requestRenderAll();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [fabricCanvas, isViewMode]);

  return null;
}
