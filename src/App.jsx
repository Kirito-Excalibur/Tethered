import { useState } from "react";
import CanvasManager from "./components/CanvasManager";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import ZoomIndicator from "./components/ZoomIndicator";
import CustomContextMenu from "./components/CustomContextMenu";
import KeyboardHandler from "./components/KeyboardHandler";

export default function App() {
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(100);
  const [isActive, setIsActive] = useState(false);
  const [menuLeft, setMenuLeft] = useState(0);
  const [menuTop, setMenuTop] = useState(0);

  const clearCanvas = () => {
    if (fabricCanvas) {
      fabricCanvas.getObjects().forEach((obj) => fabricCanvas.remove(obj));
      fabricCanvas.renderAll();
      setIsActive(false);
    }
  };

  return (
    <>
      <div className="flex justify-center">
        <CanvasManager
          setFabricCanvas={setFabricCanvas}
          setMenuLeft={setMenuLeft}
          setMenuTop={setMenuTop}
          setIsActive={setIsActive}
          setCurrentZoom={setCurrentZoom}
        />
        <ZoomIndicator currentZoom={currentZoom} />
        {isActive && (
          <CustomContextMenu
            menuLeft={menuLeft}
            menuTop={menuTop}
            clearCanvas={clearCanvas}
          />
        )}
      </div>
      <Toolbar canvas={fabricCanvas} />
      <KeyboardHandler fabricCanvas={fabricCanvas} />
    </>
  );
}
