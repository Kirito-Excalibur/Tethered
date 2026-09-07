import { useEffect } from "react";

export default function KeyboardHandler({ fabricCanvas, isViewMode, onUndo, onRedo }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Undo / Redo work in both modes
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); onUndo?.(); return; }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); onRedo?.(); return; }

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
  }, [fabricCanvas, isViewMode, onUndo, onRedo]);

  return null;
}
