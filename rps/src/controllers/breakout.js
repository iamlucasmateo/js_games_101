
import { useState } from "react";

import { BreakoutMatrix } from "../logic/breakout";
import { BreakoutCanvas, SettingsSection } from "../components/breakout";
import { GameStateEnum, InitBlocks1, InitBlocks2, InitBlocks3 } from "../schema/breakout";


const width = 60;
const length = 60;
let breakoutMatrix = new BreakoutMatrix(width, length, InitBlocks2, 1, 10);

export const Breakout = () => {
    const [ballSpeed, setBallSpeed] = useState(2);
    const [barSize, setBarSize] = useState(10);
    const [initBlocks, setInitBlocks] = useState(InitBlocks2);
    
    const style = {
        "display": "flex",
        "flexDirection": "row"
    }

    const onPlayAgainClick = () => {
        breakoutMatrix.initialize(initBlocks, ballSpeed, barSize);
    }

    const onChangeSpeedValue = (event) => {
        const speed = event.target.value;
        const speedValue = speed === "1" ? 1 : 2;
        setBallSpeed(speedValue);
        if (breakoutMatrix.gameState === GameStateEnum.Init) {
            breakoutMatrix.initialize(initBlocks, speedValue, barSize);
        }
    }

    const onChangeBarSize = (event) => {
        const selectedBarSize = event.target.value;
        const newBarSize = (
            selectedBarSize === "STANDARD" ? 11
            : selectedBarSize === "BIG" ? 31
            : 11
        )
        setBarSize(newBarSize);
        if (breakoutMatrix.gameState === GameStateEnum.Init) {
            breakoutMatrix.initialize(initBlocks, ballSpeed, newBarSize);
        }
    }

    const onChangeLevel = (event) => {
        const level = event.target.value;
        const newInitBlocks = (
            level === "Level 1" ? InitBlocks1
            : level === "Level 2" ? InitBlocks2
            : level === "Level 3" ? InitBlocks3
            : InitBlocks1
        )
        setInitBlocks(newInitBlocks);
        
        if (breakoutMatrix.gameState === GameStateEnum.Init) {
            breakoutMatrix.initialize(newInitBlocks, ballSpeed, barSize);
        }
    }

    return (
        <div style={style}>
            <BreakoutCanvas
                breakoutMatrix={breakoutMatrix}
                initBlocks={initBlocks}
                ballSpeed={ballSpeed}
                barSize={barSize}
            />
            <SettingsSection
                onPlayAgainClick={onPlayAgainClick}
                onChangeSpeedValue={onChangeSpeedValue}
                onChangeBarSize={onChangeBarSize}
                onChangeLevel={onChangeLevel}
            />
        </div>
    );
}