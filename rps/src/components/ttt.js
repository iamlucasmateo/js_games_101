export const Square = ({ data, onClick }) => {
    const squareStyle = {
        "width": "100px",
        "height": "100px",
        "border": "3px solid #999"
    }
    const getColor = (player) => {
        if (player === "player1") {
            return "blue"
        } else if (player === "player2") {
            return "red"
        }
        return "white"
    }
    return (
        <div 
            style={{...squareStyle, "backgroundColor": getColor(data.selectedBy)}}
            onClick={onClick}
            x={data.x}
            y={data.y}
        >
        </div>
    )
}