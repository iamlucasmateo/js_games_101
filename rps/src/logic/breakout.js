import {
    BallColumnDirectionEnum,
    BallRowDirectionEnum,
    BlockReductionMap,
    BlockTypes,
    CellTypeEnum,
    GameStateEnum,
    UserStateEnum
} from '../schema/breakout'


class Ball {
    constructor(row, column, rowDirection, columnDirection, renderCycles) {
        this.row = row;
        this.column = column;
        this.rowDirection = rowDirection;
        this.columnDirection = columnDirection;
        this.renderCycles = renderCycles;
    }
}

class UserBar {
    constructor(width, rowIndex, state, renderCycles) {
        this.width = width;
        this.rowIndex = rowIndex;
        this.state = state;
        this.renderCycles = renderCycles;
    }
}

export const MATRICES = [];

export class BreakoutMatrix {
    constructor(numberOfColumns, numberOfRows, initBlocks) {
        this.numberOfColumns = numberOfColumns;
        this.numberOfRows = numberOfRows;
        this.userBar = null;
        this.ball = null;
        this.matrix = null;
        this.updateCalls = 1;
        this.gameState = GameStateEnum.Init;
        this.blockWidth = 5;
        this.initialize(initBlocks);
    }

    update = (userState) => {
        this.userBar.state = userState;
        this.#updateMatrix();
        this.updateCalls += 1;

        if (this.updateCalls === Math.max(this.userBar.renderCycles, this.ball.renderCycles) + 1) {
            this.updateCalls = 1;
        }

        return this.matrix;
    }

    getMatrix = () => this.matrix;

    initialize = (initBlocks) => {
        this.#initUserBar();
        this.#initBall();
        this.#initMatrix(initBlocks);
        this.updateCalls = 1;
        this.gameState = GameStateEnum.Init;

    }

    setGameState = (gameState) => {
        this.gameState = gameState;
    }

    #updateMatrix = () => {
        this.#updateUser();
        this.#updateBallAndCollisions();
    }

    #updateUser = () => {
        const userRow = this.matrix[this.userBar.rowIndex];
        const currentUserStartColumn = userRow.indexOf(CellTypeEnum.User);

        const userAtLeftBoundary = currentUserStartColumn === 0;
        const goingLeft = this.userBar.state === UserStateEnum.Left;
        const userAtRightBoundary = currentUserStartColumn + this.userBar.width === this.numberOfColumns;
        const goingRight = this.userBar.state === UserStateEnum.Right;
        const skipRenderCycle = (this.userBar.renderCycles % this.updateCalls !== 0)
        const dontMoveUser = (userAtLeftBoundary && goingLeft) || (userAtRightBoundary && goingRight) || (skipRenderCycle) || this.userBar.state === UserStateEnum.Static;
        const valueChange = dontMoveUser ? 0 : this.userBar.state === UserStateEnum.Left ? -1 : 1;
        const newUserArray = this.#createUserArray(currentUserStartColumn + valueChange);

        this.matrix[this.userBar.rowIndex] = newUserArray;
    }

    #updateBallAndCollisions = () => {
        let newBallState = { ...this.ball };
        const skipRenderCycle = this.updateCalls % this.ball.renderCycles !== 0;
        // Don't update ball
        if (skipRenderCycle) {
            return newBallState;
        }

        this.#updateIfBoundaryCollision(newBallState);
        this.#updateIfBlockCollision(newBallState);
        this.#updateIfUserCollision(newBallState);
        
        const rowValueUpdate = newBallState.rowDirection === BallRowDirectionEnum.Down ? 1 : -1;
        newBallState.row += rowValueUpdate;
        const columnValueUpdate = newBallState.columnDirection === BallColumnDirectionEnum.Right ? 1 : -1;
        newBallState.column += columnValueUpdate;

        this.#assignCellType(this.ball.row, this.ball.column, CellTypeEnum.Blank);        
        this.ball = newBallState;
        this.#addBall(this.ball.row, this.ball.column);
        
        if (this.ball.row === this.userBar.rowIndex - 1) {
            console.log("-1")
            console.log(newBallState.row !== this.userBar.rowIndex - 1)
            // console.log(this.matrix[this.ball.row])
            // console.log(this.matrix[this.userBar.rowIndex])
            const userRow = this.matrix[this.userBar.rowIndex];
            let currentUserStartColumn = userRow.indexOf(CellTypeEnum.User);
            const userColumns = this.#createArray(this.userBar.width, () => currentUserStartColumn++);
            console.log(userColumns);
            console.log(this.ball.column);
            if (userColumns.includes(this.ball.column)) {
                console.log(this.matrix[this.userBar.rowIndex])
                console.log("OK");
            }
        }

        const gameOver = this.ball.row === this.numberOfRows - 1;
        if (gameOver) {
            this.gameState = GameStateEnum.GameOver;
        }

    }

    #updateIfBoundaryCollision = (newBallState) => {
        // Horizontal boundary collision
        if (newBallState.column === this.numberOfColumns - 1) {
            newBallState.columnDirection = BallColumnDirectionEnum.Left;
        } else if (newBallState.column === 0) {
            newBallState.columnDirection = BallColumnDirectionEnum.Right;
        }

        // Vertical boundary collision
        if (newBallState.row === 0) {
            newBallState.rowDirection = BallRowDirectionEnum.Down;
        }

    }

    #updateIfBlockCollision = (newBallState) => {
        // Horizontal block collision
        const blockToTheLeft = BlockTypes.includes(this.matrix[newBallState.row][newBallState.column - 1]);
        const blockToTheRight = BlockTypes.includes(this.matrix[newBallState.row][newBallState.column + 1]);
        if (blockToTheLeft) {
            newBallState.columnDirection = BallColumnDirectionEnum.Right;
            this.#reduceBlock(newBallState.row, newBallState.column - 1);
        } else if (blockToTheRight) {
            newBallState.columnDirection = BallColumnDirectionEnum.Left;
            this.#reduceBlock(newBallState.row, newBallState.column + 1);
        }

        // Vertical block collision
        const blockOnTop = (newBallState.row > 0) && (BlockTypes.includes(this.matrix[newBallState.row - 1][newBallState.column]));
        const blockBelow = BlockTypes.includes(this.matrix[newBallState.row + 1][newBallState.column]);
        if (blockOnTop) {
            newBallState.rowDirection = BallRowDirectionEnum.Down;
            this.#reduceBlock(newBallState.row - 1 , newBallState.column);
        } else if (blockBelow) {
            newBallState.rowDirection = BallRowDirectionEnum.Up;
            this.#reduceBlock(newBallState.row + 1, newBallState.column);
        }
    }

    #reduceBlock = (row, column) => {
        const isBlockColumn = (col) => BlockTypes.includes(this.matrix[row][col]);
        // check to the right
        let columnToCheck = column;
        while (isBlockColumn(columnToCheck)) {
            const reducedBlock = BlockReductionMap[this.matrix[row][columnToCheck]];
            this.matrix[row][columnToCheck] = reducedBlock;
            columnToCheck += 1;
        }

        // check to the left
        columnToCheck = column - 1;
        while (isBlockColumn(columnToCheck)) {
            const reducedBlock = BlockReductionMap[this.matrix[row][columnToCheck]];
            this.matrix[row][columnToCheck] = reducedBlock;
            columnToCheck -= 1;
        }

    }

    #updateIfUserCollision = (newBallState) => {
        if (newBallState.row !== this.userBar.rowIndex - 1) return;
        
        const userRow = this.matrix[this.userBar.rowIndex];
        let currentUserStartColumn = userRow.indexOf(CellTypeEnum.User);
        const userColumns = this.#createArray(this.userBar.width, () => currentUserStartColumn++);
        if (userColumns.includes(newBallState.column)) {
            newBallState.rowDirection = BallRowDirectionEnum.Up;
        }
    }

    #createRow = (mapFunction) => {
        return this.#createArray(this.numberOfColumns, mapFunction);
    }

    #createBlankRow = () => {
        return this.#createRow(() => CellTypeEnum.Blank);
    }

    #createCenteredBlockRow = (totalBlocks, blockType) => {
        const blockSpace = totalBlocks * (this.blockWidth + 1);
        const firstBlockColumn = Math.ceil((this.numberOfColumns - blockSpace) / 2);
        const lastBlockColumn = firstBlockColumn + blockSpace;
        const isBlankColumn = (column) => (column < firstBlockColumn) || (column >= lastBlockColumn)
        
        const blockRow = [];
        let elapsedBlockWidth = 0;
        for (let col = 0; col < this.numberOfColumns; col++) {
            if (isBlankColumn(col)) {
                blockRow.push(CellTypeEnum.Blank);
            } else if (elapsedBlockWidth < this.blockWidth) {
                blockRow.push(blockType)
                elapsedBlockWidth += 1;
            } else if (elapsedBlockWidth === this.blockWidth) {
                blockRow.push(CellTypeEnum.Blank);
                elapsedBlockWidth = 0;
            }
        }
        
        return blockRow;
    }

    #createArray = (length, mapFunction) => {
        return Array.from(Array(length)).map(mapFunction);
    }

    #createUserArray = (userStartColumn) => {
        const userColumns = this.#createArray(this.userBar.width, (_, index) => userStartColumn + index);
        const getUserColumn = (_, column) => {
            if (userColumns.includes(column)) {
                return CellTypeEnum.User;
            } else {
                return CellTypeEnum.Blank;
            }
        };

        return this.#createRow(getUserColumn);
    }

    #createUserInitArray = () => {
        const columnLeftOfTheUser = Math.floor((this.numberOfColumns - this.userBar.width) / 2);

        return this.#createUserArray(columnLeftOfTheUser + 1);
    }

    #initMatrix = (initBlocks) => {
        const emptyMatrix = Array.from(Array(this.numberOfRows));
        const matrix = emptyMatrix.map((_, row) => {
            if (row === this.userBar.rowIndex) {
                return this.#createUserInitArray();
            } else if (Object.keys(initBlocks).includes(String(row))) {
                const howManyBlocks = initBlocks[row].blockQuantity;
                const blockType = initBlocks[row].blockType;
                return this.#createCenteredBlockRow(howManyBlocks, blockType);
            } else {
                return this.#createBlankRow();
            }
        });

        this.matrix = matrix;
        const ballColumn = Math.floor(this.numberOfColumns / 2);
        const ballRow = this.userBar.rowIndex - 1;
        this.#addBall(ballRow, ballColumn);

        return this.matrix
    }

    #initBall = function () {
        const initRow = this.userBar.rowIndex - 1;
        const initColumn = Math.round(this.numberOfColumns / 2);
        const columnDirection = BallColumnDirectionEnum.Right;
        const rowDirection = BallRowDirectionEnum.Up;
        const renderCycles = 1;
        const ball = new Ball(initRow, initColumn, rowDirection, columnDirection, renderCycles);

        this.ball = ball;
    }

    #addBall = (row, column) => {
        this.#assignCellType(row, column, CellTypeEnum.Ball);
    }

    #assignCellType = (row, column, type) => {
        this.matrix[row][column] = type;
    }

    #initUserBar = () => {
        const userWidth = 50;
        const userRowIndex = this.numberOfRows - 4;
        const userInitState = UserStateEnum.Static;
        const userRenderCycles = 1;
        this.userBar = new UserBar(userWidth, userRowIndex, userInitState, userRenderCycles);
    }
}
