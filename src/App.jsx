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
  const handleRightClick = (e) => {
    e.preventDefault();
    console.log("Right click"); // Make sure this shows
  };

  useEffect(() => {
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
        const pointer = canvas.getViewportPoint(event);

        setIsActive((prev) => !prev);

        console.log(
          `Right-clicked on Fabric canvas at ${pointer.x}, ${pointer.y})`
        );
      }
    });

    // Disable browser context menu
    canvas.upperCanvasEl.addEventListener("contextmenu", (e) =>
      e.preventDefault()
    );

    canvas.upperCanvasEl.addEventListener("mousedown", (event) => {
      if(event.button===0){
        setIsActive(false);
        console.log("Left click");
      }
    })
    // const handleResize = () => {
    //   canvas.setWidth(window.innerWidth);
    //   canvas.setHeight(window.innerHeight);
    // };

    // window.addEventListener('resize', handleResize);
    return () => {
      // window.removeEventListener('resize', handleResize);

      // Clean up event listeners
   

      canvas.dispose();
    };
  }, []);

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
        <canvas ref={canvasRef} />
     
      </div>
      {/* <!-- Custom Context Menu --> */}
      <div
        id="custom-menu"
        className={isActive?"absolute z-50  bg-white border border-gray-300 rounded shadow-lg":"hidden"}
      >
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
          onClick={() => alert("Clicked Option 1")}
        >
          Option 1
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
