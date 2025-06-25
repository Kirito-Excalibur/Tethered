import { useEffect, useRef } from "react";
import { Canvas } from "fabric";

export default function CanvasManager({ setFabricCanvas, setMenuLeft, setMenuTop, setIsActive, setCurrentZoom }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = new Canvas(canvasRef.current, {
      width: 1500,
      height: 800,
      backgroundColor: "#f0f0f0",
    });

    setFabricCanvas(canvas);
    canvas.renderAll();

    canvas.on("mouse:over", (event) => {
      if (event.target) {
        canvas.setCursor("");
        canvas.requestRenderAll();
      }
    });

    canvas.on("mouse:out", () => {
      canvas.setCursor("default");
      canvas.requestRenderAll();
    });

    const handleRightClick = (event) => {
      event.preventDefault();
      console.log(event)
      setMenuLeft(event.clientX);
      setMenuTop(event.clientY);
      setIsActive(true);
    };

    const handleClick = (event) => {
      const canvasElement = canvas.upperCanvasEl;
      if (!canvasElement.contains(event.target)) {
        setIsActive(false);
      } else {
        setIsActive(false);
      }
    };

    canvas.on("mouse:down", (event) => {
        if (event.e.button === 0) {
          setIsActive(false);
          console.log(`Left click and ${event.e.type} and ${event.target?.type}`);
        }
  
        console.log(`${event.e.button}`)
  
      });

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

    canvas.upperCanvasEl.addEventListener("contextmenu", handleRightClick);
  

    return () => {
      canvas.dispose();
    
    };
  }, [setFabricCanvas, setMenuLeft, setMenuTop, setIsActive, setCurrentZoom]);

  return <canvas id="canvas" className="border-2 border-black" ref={canvasRef} />;
}