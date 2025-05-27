import { useEffect, useRef, useState } from "react";
import { Canvas, Rect, Textbox } from "fabric";
import Toolbar from "./components/Toolbar";
import Sidebar from "./components/Sidebar";

export default function App() {
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [menuLeft, setMenuLeft] = useState(0);
  const [menuTop, setMenuTop] = useState(0);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Initialize Fabric.js canvas
    const canvas = new Canvas(canvasRef.current, {
      width: 1500,
      height: 800,
      backgroundColor: "#f0f0f0",
    });

    // const rect = new Rect({
    //   left: 100,
    //   top: 100,
    //   fill: "blue",
    //   width: 100,
    //   height: 100,
    // });

    // canvas.add(rect);
    setFabricCanvas(canvas);
    canvas.renderAll();


  




//Open custom context menu on right click
    canvas.on("contextmenu", (event) => {
      if (event.e.button === 2) {
        // Right-click = 2
        const pointer = canvas.getScenePoint(event);

        setMenuLeft(event.e.x);
        setMenuTop(event.e.y);

        setIsActive((prev) => !prev);

        console.log(
          `Right-clicked on Fabric canvas at ${event.e.x}, ${event.e.y})`
        );
      }
    });

    // Disable browser context menu
    canvas.on("contextmenu", (e) =>
      e.e.preventDefault()
    );

    // Handle left-click to close the context menu
    canvas.on("mouse:down", (event) => {
      if (event.e.button === 0) {
        setIsActive(false);
        console.log(`Left click and ${event.e.type} and ${event.target?.type}`);
      }

      console.log(`${event.e.button}`)

    });


    //Change of bg of textbox on hover
    // canvas.on("mouse:over", (event) => {
    //   const target=event.target;
    //   if(!target) return;
    //   const textbox = target.type
      
    //   console.log("Hovered over:", textbox, target, canvas.getActiveObject());

    //   if (textbox=='textbox') {
    //     // canvas.defaultCursor = "pointer";
    //     target.set({backgroundColor:"red"});
    //   }
    //   canvas.requestRenderAll(); // use this instead of canvas.renderAll()
    // })


    //Reset bg of textbox on mouse out
    // canvas.on("mouse:out", (event) => {
    //   const target=event.target;
    //   if(!target) return;
    //   const textbox = target.type
    //   console.log("Mouse out of:", textbox, target);

    //   if (textbox=='textbox') {
    //     // canvas.defaultCursor = "default";
    //     target.set({backgroundColor:"black"});
    //   }
    //   canvas.requestRenderAll(); // use this instead of canvas.renderAll()
    // });

    //Change bg of textbox on selection
    canvas.on("selection:created", (event) => {
      const target = event;
      if (!target) return;
      const textbox = target.selected[0]?.type;

  
      if (textbox == 'textbox') {
        console.log("Selected Textbox:", textbox);
        target.selected[0].set({
          backgroundColor: "gray",
        });
      }
      canvas.requestRenderAll(); // use this instead of canvas.renderAll()
    })


     //Change bg of textbox on selection
     canvas.on("selection:cleared", (event) => {
      const target = event;
      if (!target) return;
      const textbox = target.deselected[0]?.type;

  
      if (textbox == 'textbox') {
        console.log("Selected Textbox:", textbox);
        target.deselected[0].set({
          backgroundColor: "black",
        });
      }
      canvas.requestRenderAll(); // use this instead of canvas.renderAll()
    })


    //Zooming
    canvas.upperCanvasEl.addEventListener("wheel", (event) => {
      const delta = event.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.min(Math.max(zoom, 0.2), 5);
      canvas.zoomToPoint({ x: event.offsetX, y: event.offsetY }, zoom);
      setCurrentZoom(zoom * 100);
      event.preventDefault();
      event.stopPropagation();
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
    fabricCanvas.renderAll();
    setIsActive(false);
  };

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
        <div
          id="zoom-indicator"
          className="absolute top-2 left-2 bg-white border border-gray-300 text-sm px-3 py-1 rounded shadow-md select-none"
        >
          {currentZoom.toFixed(0)}%
        </div>
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
