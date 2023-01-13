
import { BreakoutMatrix } from "../logic/breakout";
import { BreakoutCanvas, ButtonSection } from "../components/breakout";
import { InitBlocks1 } from "../schema/breakout";


const width = 60;
const length = 60;
let breakoutMatrix = new BreakoutMatrix(width, length, InitBlocks1);

export const Breakout = () => {
    const style = {
        "display": "flex",
        "flexDirection": "row"
    }

    const onPlayAgainClick = () => {
        breakoutMatrix.initialize(InitBlocks1);
    }

    const onChangeSpeedValue = (event) => {
        console.log(event.target.value);
    }

    return (
        <div style={style}>
            <BreakoutCanvas breakoutMatrix={breakoutMatrix} initBlocks={InitBlocks1}/>
            <ButtonSection
                onPlayAgainClick={onPlayAgainClick}
                onChangeSpeedValue={onChangeSpeedValue}
            />
        </div>
    );
}