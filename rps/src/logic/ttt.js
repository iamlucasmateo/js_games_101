import { Game } from "./rps";

export function TTTGame() {
    this.turn = "player1";
    this.winner = null;

    function initBoardBuilder() {
        const board = {}
        for (let i of [1, 2, 3]) {
            for (let j of [1, 2, 3]) {
                let key = `x${i}y${j}`
                board[key] = { 
                    selectedBy: "none",
                    x: i,
                    y: j
                }
            }
        }
        return board;
    };

    this.update = (x, y) => {
        if (this.winner) return;
        const selectedKey = `x${x}y${y}`
        if (this.board[selectedKey].selectedBy !== "none") {
            return
        }
        this.board[selectedKey].selectedBy = this.turn;
        this.turn = this.turn === "player1" ? "player2" : "player1";
        this.winner = this.checkWinner();
    };

    this.checkWinner = () => {
        // check horizontal games
        for (let row of [1, 2, 3]) {
            let grid = [1, 2, 3].map(i => this.board[`x${i}y${row}`].selectedBy)
            if (new Set(grid).size === 1 && grid[0] !== "none") {
                return grid[0]
            }
        }

        // check vertical games
        for (let col of [1, 2, 3]) {
            let grid = [1, 2, 3].map(j => this.board[`x${col}y${j}`].selectedBy)
            if (new Set(grid).size === 1 && grid[0] !== "none") {
                return grid[0]
            }
        }
        for (let diagonal of [["x1y1", "x2y2", "x3y3"], ["x3y1", "x2y2", "x1y3"]]) {
            let diagonalValues = diagonal.map(coords => this.board[coords].selectedBy);
            if (new Set(diagonalValues).size === 1 && diagonalValues[0] !== "none"){
                return diagonalValues[0]
            }
        }

        return null;
    }

    this.board = initBoardBuilder();

    return this
}