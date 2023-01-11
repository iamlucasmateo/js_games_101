import { useRef, useEffect, useState } from "react";
import { TileMapCanvas } from "./canvas";
import { GameStateEnum, ImageMap, UserStateEnum } from "../schema/breakout";


const breakoutCanvasStyle = {
    width: "520px",
    height: "520px",
    border: "1px solid white" 
}

export const BreakoutCanvas = ({breakoutMatrix}) => {
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
        const numberOfColumns = breakoutMatrix.numberOfColumns;
        const numberOfRows = breakoutMatrix.numberOfRows;
        const tileMap = new TileMapCanvas(ImageMap, canvasRef.current, numberOfRows, numberOfColumns);
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
                breakoutMatrix.initialize();
                tileMap.updateCanvas(breakoutMatrix.getMatrix());
            }
            requestId = requestAnimationFrame(render);
        };
        render();
        return () => {
            cancelAnimationFrame(requestId);
        };
    }, [userState, breakoutMatrix]);

    return (
        <div tabIndex={-1} onKeyDown={onKeyDown}>
            <canvas ref={canvasRef} style={breakoutCanvasStyle}></canvas>
        </div>
    );
}

export const ButtonSection = ({onPlayAgainClick}) => {
    const sectionStyle = {
        "marginLeft": "10px",
    }
    return (
        <div style={sectionStyle}>
            <button onClick={onPlayAgainClick}>PlayAgain</button>
        </div>
    )

}