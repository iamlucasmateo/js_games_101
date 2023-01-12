import { useRef, useEffect, useState } from "react";
import { TileMapCanvas } from "./canvas";
import { CellTypeEnum, GameStateEnum, UserStateEnum } from "../schema/breakout";


const breakoutCanvasStyle = {
    width: "520px",
    height: "520px",
    border: "1px solid white" 
}

function fillRectangleWithColor(color) {
    function fillRectangle(context, xCoord, yCoord, tileWidth, tileHeight) {
        context.fillStyle = color;
        context.fillRect(xCoord, yCoord, tileWidth, tileHeight);
    }

    return fillRectangle;
}

export const BreakoutImageMap = {
    [CellTypeEnum.Blank]: fillRectangleWithColor("#FFF"),
    [CellTypeEnum.User]: fillRectangleWithColor("#0A0"),
    [CellTypeEnum.Ball]: fillRectangleWithColor("#000"),
    [CellTypeEnum.BlockWithLives_1]: fillRectangleWithColor("#00F"),
    [CellTypeEnum.BlockWithLives_2]: fillRectangleWithColor("#00C"),
    [CellTypeEnum.BlockWithLives_3]: fillRectangleWithColor("#009"),
}

const resumableStates = [GameStateEnum.Init, GameStateEnum.Paused]

export const BreakoutCanvas = ({ breakoutMatrix, initBlocks }) => {
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
            } else if (event.key === SPACEBAR_VALUE) {
                breakoutMatrix.setGameState(GameStateEnum.Paused);
            }
        } else if (resumableStates.includes(breakoutMatrix.gameState)) {
            if (event.key === SPACEBAR_VALUE) {
                breakoutMatrix.setGameState(GameStateEnum.Playing);
            }
        }
        setUserState(newUserState);
    }


    useEffect(() => {
        const numberOfColumns = breakoutMatrix.numberOfColumns;
        const numberOfRows = breakoutMatrix.numberOfRows;
        const tileMap = new TileMapCanvas(BreakoutImageMap, canvasRef.current, numberOfRows, numberOfColumns);
        let requestId;
        const render = () => {
            if (breakoutMatrix.gameState === GameStateEnum.Playing) {
                breakoutMatrix.update(userState);
                const gameMatrix = breakoutMatrix.getMatrix();
                tileMap.updateCanvas(gameMatrix);
            } else if (breakoutMatrix.gameState === GameStateEnum.GameOver) {
                tileMap.showTextCanvas("Game Over");
            } else if (breakoutMatrix.gameState === GameStateEnum.UserWon) {
                tileMap.showTextCanvas("You Won!");
            } else if (breakoutMatrix.gameState === GameStateEnum.Init) {
                setUserState(UserStateEnum.Static);
                breakoutMatrix.initialize(initBlocks);
                tileMap.updateCanvas(breakoutMatrix.getMatrix());
            }
            requestId = requestAnimationFrame(render);
        };
        render();
        return () => {
            cancelAnimationFrame(requestId);
        };
    }, [userState, breakoutMatrix, initBlocks]);

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