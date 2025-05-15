import { useEffect, useRef, useState } from "react";
import { Canvas, Rect } from "fabric";
import Toolbar from "./components/Toolbar";
import Sidebar from "./components/Sidebar";

export default function App() {
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [menuLeft, setMenuLeft] = useState(0);
  const [menuTop, setMenuTop] = useState(0);
  const [fabricCanvas, setFabricCanvas] = useState(null);


  useEffect(() => {

    // Initialize Fabric.js canvas
    const canvas = new Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      backgroundColor: "#f0f0f0",
    });

    const rect = new Rect({
      left: 100,
      top: 100,
      fill: "blue",
      width: 100,
      height: 100,
    });

    canvas.add(rect);
    setFabricCanvas(canvas);

    canvas.upperCanvasEl.addEventListener("mousedown", (event) => {
      if (event.button === 2) {
        // Right-click = 2
        const pointer = canvas.getScenePoint(event);

        setMenuLeft(event.x);
        setMenuTop(event.y);

        setIsActive((prev) => !prev);

        console.log(
          `Right-clicked on Fabric canvas at ${event.x}, ${event.y})`
        );
      }
    });

    // Disable browser context menu
    canvas.upperCanvasEl.addEventListener("contextmenu", (e) =>
      e.preventDefault()
    );

    canvas.upperCanvasEl.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        setIsActive(false);
        console.log("Left click");
      }
    });
    // const handleResize = () => {
    //   canvas.setWidth(window.innerWidth);
    //   canvas.setHeight(window.innerHeight);
    // };

    // window.addEventListener('resize', handleResize);
    return () => {
      // window.removeEventListener('resize', handleResize);

      //Umount the canvas
      canvas.dispose();
    };
  }, []);

 const clearCanvas = () => {
    if (fabricCanvas) {
      fabricCanvas.getObjects().forEach((obj) => fabricCanvas.remove(obj));
  }
  fabricCanvas.renderAll()
  setIsActive(false);

  }

  console.log(menuLeft, menuTop);

  return (
    <>
      <Sidebar canvas={fabricCanvas} />
      {/* <canvas
    width={300}
    height={150}
    onContextMenu={handleRightClick}
    style={{ border: '2px solid red' }}
  /> */}
      <div className="flex justify-center">
        <canvas className="border-2 border-black" ref={canvasRef} />
      </div>
      {/* <!-- Custom Context Menu --> */}
      <div
        id="custom-menu"
        className={
          isActive
            ? `absolute z-50 bg-white border border-gray-300 rounded shadow-lg`
            : "hidden"
        }
        style={{
          left: menuLeft,
          top: menuTop,
     
        }}
      >
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
          onClick={clearCanvas}
        >
          Clear Canvas
        </button>
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
          onClick={() => alert("Clicked Option 2")}
        >
          Option 2
        </button>
      </div>

      {/* <div
        onContextMenu={handleRightClick}
        className="w-[100px] h-[100px] border-4 border-black"
      >
        Click here
      </div> */}

      <Toolbar canvas={fabricCanvas} />
    </>
  );
}
