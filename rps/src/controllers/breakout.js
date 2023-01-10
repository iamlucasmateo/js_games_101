import { useRef, useEffect, useState } from "react";
import { BreakoutMatrix } from "../logic/breakout";
import { TileMapCanvas } from "../components/breakout";
import { GameStateEnum, ImageMap, UserStateEnum } from "../schema/breakout";


const canvasStyle = {
    width: "500px",
    height: "500px",
    border: "1px solid white" 
}

const width = 50;
const length = 50;
let breakoutMatrix = new BreakoutMatrix(width, length);

export const Breakout = () => {
    let canvasRef = useRef();
    const [userState, setUserState] = useState(UserStateEnum.Static);
    
    const onKeyDown = (event) => {
        const SPACEBAR_VALUE = " "; 
        let newUserState = userState;
        if (breakoutMatrix.gameState === GameStateEnum.Playing) {
            if (event.key === "ArrowLeft") {
                newUserState = UserStateEnum.Left;
            } else if (event.key === "ArrowRight") {
                newUserState = UserStateEnum.Right;
            }
        } else if (breakoutMatrix.gameState === GameStateEnum.Init) {
            if (event.key === SPACEBAR_VALUE) {
                breakoutMatrix.setGameState(GameStateEnum.Playing);
            }
        }
        setUserState(newUserState);
    }

    useEffect(() => {
        const tileMap = new TileMapCanvas(ImageMap, canvasRef.current, width, length);
        let requestId;
        const render = () => {
            if (breakoutMatrix.gameState === GameStateEnum.Playing) {
                breakoutMatrix.update(userState);
                const gameMatrix = breakoutMatrix.getMatrix();
                tileMap.updateCanvas(gameMatrix);
            } else if (breakoutMatrix.gameState === GameStateEnum.GameOver) {
                tileMap.showTextCanvas("Game Over");
            } else if (breakoutMatrix.gameState === GameStateEnum.Init) {
                setUserState(UserStateEnum.Static);
                breakoutMatrix = new BreakoutMatrix(width, length);
                const gameMatrix = breakoutMatrix.getMatrix();
                tileMap.updateCanvas(gameMatrix);
            }
            requestId = requestAnimationFrame(render);
        };
        render();
        return () => {
            cancelAnimationFrame(requestId);
        };
    }, [userState]);

    return (
        <div tabIndex={-1} onKeyDown={onKeyDown}>
            <canvas ref={canvasRef} style={canvasStyle}></canvas>
        </div>
    );
}