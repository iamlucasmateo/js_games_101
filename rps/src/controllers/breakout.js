
import { BreakoutMatrix } from "../logic/breakout";
import { BreakoutCanvas, ButtonSection } from "../components/breakout";


const width = 60;
const length = 60;
let breakoutMatrix = new BreakoutMatrix(width, length);

export const Breakout = () => {
    const style = {
        "display": "flex",
        "flexDirection": "row"
    }

    const onPlayAgainClick = () => {
        breakoutMatrix.initialize();
    }

    return (
        <div style={style}>
            <BreakoutCanvas breakoutMatrix={breakoutMatrix}/>
            <ButtonSection onPlayAgainClick={onPlayAgainClick}/>
        </div>
    );
}