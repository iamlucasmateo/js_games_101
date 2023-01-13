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
    [CellTypeEnum.Blank]: fillRectangleWithColor("#fffbfa"),
    [CellTypeEnum.User]: fillRectangleWithColor("#2a9d8f"),
    [CellTypeEnum.Ball]: fillRectangleWithColor("#010110"),
    [CellTypeEnum.BlockWithLives_1]: fillRectangleWithColor("#e9c46a"),
    [CellTypeEnum.BlockWithLives_2]: fillRectangleWithColor("#f4a261"),
    [CellTypeEnum.BlockWithLives_3]: fillRectangleWithColor("#e76f51"),
}

const resumableStates = [GameStateEnum.Init, GameStateEnum.Paused]

export const BreakoutCanvas = ({
    breakoutMatrix,
    initBlocks,
    ballSpeed,
    barSize,
}) => {
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


const BallSpeedOptions = ({onChangeSpeedValue}) => {
    return (
        <div onChange={onChangeSpeedValue}>
            <p>Ball speed</p>
            <input type="radio" value={2} name="BallSpeed" defaultChecked={true}/>Slow
            <input type="radio" value={1} name="BallSpeed" />Fast
        </div>
    )
}


const BarSizeOptions = ({onChangeBarSize}) => {
    return (
        <div onChange={onChangeBarSize}>
            <p>Bar Size</p>
            <input type="radio" value={"STANDARD"} name="BarSize" defaultChecked={true}/>Standard
            <input type="radio" value={"BIG"} name="BarSize"/>Big
        </div>
    )
}


const LevelOptions = ({onChangeLevel}) => {
    return (
        <div onChange={onChangeLevel}>
            <p>Level</p>
            <input type="radio" value="Level 1" name="Level"/>Level 1
            <input type="radio" value="Level 2" name="Level" defaultChecked={true}/>Level 2
            <input type="radio" value="Level 3" name="Level"/>Level 3
        </div>
    )
}


export const SettingsSection = ({
    onPlayAgainClick,
    onChangeSpeedValue,
    onChangeBarSize,
    onChangeLevel
}) => {
    const sectionStyle = {
        "marginLeft": "10px",
    }
    return (
        <div style={sectionStyle}>
            <button onClick={onPlayAgainClick}>PlayAgain</button>
            <BallSpeedOptions onChangeSpeedValue={onChangeSpeedValue}/>
            <BarSizeOptions onChangeBarSize={onChangeBarSize}/>
            <LevelOptions onChangeLevel={onChangeLevel}/>
        </div>
    )

}
 