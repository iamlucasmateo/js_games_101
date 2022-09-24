import { useState } from "react";
import { Square } from "../components/ttt";
import { TTTGame } from "../logic/ttt";

export const TicTacToe = () => {
    const [game, setGame] = useState(new TTTGame());
    const [board, setBoard] = useState(game.board);
    const [turn, setTurn] = useState(game.turn);
    const [winner, setWinner] = useState(game.winner);

    const onClick = (click) => {
        const x = click.target.getAttribute("x")
        const y = click.target.getAttribute("y")
        game.update(x, y)
        setBoard(game.board);
        setTurn(game.turn);
        setWinner(game.winner)
    }

    return (
        <div>
            <div id="board" style={{"display": "flex", "flexDirection": "row"}}>
                <div>
                    <Square data={board.x1y1} onClick={onClick}/>
                    <Square data={board.x1y2} onClick={onClick}/>
                    <Square data={board.x1y3} onClick={onClick}/>
                </div>
                <div>
                    <Square data={board.x2y1} onClick={onClick}/>
                    <Square data={board.x2y2} onClick={onClick}/>
                    <Square data={board.x2y3} onClick={onClick}/>
                </div>
                <div>
                    <Square data={board.x3y1} onClick={onClick}/>
                    <Square data={board.x3y2} onClick={onClick}/>
                    <Square data={board.x3y3} onClick={onClick}/>
                </div>
            </div>
            <div>
                <p>Turn: {turn}</p>
                <p>Winner: {winner}</p>
            </div>

        </div>
    )
}