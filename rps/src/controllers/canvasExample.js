import { useRef, useEffect } from "react";
import { CanvasUpdater } from "../logic/canvas";

export const CanvasExample = () => {
    let ref = useRef();
    const style = {
        width: "400px",
        height: "400px",
        border: "1px solid white" 
    }
    
    useEffect(() => {
        const updater = new CanvasUpdater(ref.current);
        updater.normalizeCanvasAspectRatio();
        let requestId;
        let cosineArg = 0;
        const render = () => {
            updater.createCircle(cosineArg);
            cosineArg += 0.05;
            requestId = requestAnimationFrame(render);
        };
        render();
     
        return () => {
            cancelAnimationFrame(requestId);
        };
    });

    return (
        <canvas ref={ref} style={style}></canvas>
    );
}