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
        this.initBlocks = initBlocks;
        this.initialize(initBlocks);
    }

    update = (userState) => {
        this.userBar.state = userState;
        if (this.gameState === GameStateEnum.Playing) {
            this.#updateMatrix();
            this.updateCalls += 1;
        }

        const largestRenderCycle = Math.max(this.userBar.renderCycles, this.ball.renderCycles) + 1 
        if (this.updateCalls === largestRenderCycle) {
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
        const skipRenderCycle = (this.updateCalls % this.userBar.renderCycles !== 0)
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

        const gameOver = this.ball.row === this.numberOfRows - 1;
        if (gameOver) {
            this.gameState = GameStateEnum.GameOver;
        }

        if (this.#userWon()) {
            this.gameState = GameStateEnum.UserWon;
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
        let [rowForBlockReduction, columnForBlockReduction] = this.#updateBlockRowAndColumnIfHorizontalCollision(newBallState);
        if (rowForBlockReduction === null && columnForBlockReduction === null) {
            [rowForBlockReduction, columnForBlockReduction] = this.#updateBlockRowAndColumnIfVerticalCollision(newBallState);
        }
        if (rowForBlockReduction === null && columnForBlockReduction === null) {
            [rowForBlockReduction, columnForBlockReduction] = this.#updateBlockRowAndColumnIfDiagonalCollision(newBallState);
        }
        if (rowForBlockReduction === null && columnForBlockReduction === null) {
            return;
        }
        this.#reduceBlock(rowForBlockReduction, columnForBlockReduction);
    }

    #updateBlockRowAndColumnIfHorizontalCollision = (newBallState) => {
        let rowForBlockReduction = null;
        let columnForBlockReduction = null;
        const blockToTheLeft = BlockTypes.includes(this.matrix[newBallState.row][newBallState.column - 1]);
        const blockToTheRight = BlockTypes.includes(this.matrix[newBallState.row][newBallState.column + 1]);
        if (blockToTheLeft) {
            newBallState.columnDirection = BallColumnDirectionEnum.Right;
            rowForBlockReduction = newBallState.row;
            columnForBlockReduction = newBallState.column - 1 
        } else if (blockToTheRight) {
            newBallState.columnDirection = BallColumnDirectionEnum.Left;
            rowForBlockReduction = newBallState.row
            columnForBlockReduction = newBallState.column + 1;
        }

        return [rowForBlockReduction, columnForBlockReduction]
    }

    #updateBlockRowAndColumnIfVerticalCollision = (newBallState) => {
        let rowForBlockReduction = null;
        let columnForBlockReduction = null;
        const blockOnTop = (newBallState.row > 0) && (BlockTypes.includes(this.matrix[newBallState.row - 1][newBallState.column]));
        const blockBelow = BlockTypes.includes(this.matrix[newBallState.row + 1][newBallState.column]);
        if (blockOnTop) {
            newBallState.rowDirection = BallRowDirectionEnum.Down;
            rowForBlockReduction = newBallState.row - 1;
            columnForBlockReduction = newBallState.column;
        } else if (blockBelow) {
            newBallState.rowDirection = BallRowDirectionEnum.Up;
            rowForBlockReduction = newBallState.row + 1;
            columnForBlockReduction = newBallState.column;
        }

        return [rowForBlockReduction, columnForBlockReduction]
    }

    #updateBlockRowAndColumnIfDiagonalCollision = (newBallState) => {
        let rowForBlockReduction = null;
        let columnForBlockReduction = null;
        
        const columnToTheRight = newBallState.column + 1;
        const columnToTheLeft = newBallState.column - 1;
        const rowUp = newBallState.row - 1;
        const rowDown = newBallState.row + 1;   
        
        const collisionToTheLeftDown = (
            BlockTypes.includes(this.matrix[rowDown][columnToTheLeft])
            && newBallState.rowDirection === BallRowDirectionEnum.Down
            && newBallState.columnDirection === BallColumnDirectionEnum.Left
        )
        if (collisionToTheLeftDown) {
            newBallState.rowDirection = BallRowDirectionEnum.Up;
            newBallState.columnDirection = BallColumnDirectionEnum.Right;
            rowForBlockReduction = rowDown;
            columnForBlockReduction = columnToTheLeft;
        }
        const collisionToTheLeftUp = (
            rowUp > 0
            && BlockTypes.includes(this.matrix[rowUp][columnToTheLeft])
            && newBallState.rowDirection === BallRowDirectionEnum.Up
            && newBallState.columnDirection === BallColumnDirectionEnum.Left 
        )
        if (collisionToTheLeftUp) {
            newBallState.rowDirection = BallRowDirectionEnum.Down;
            newBallState.columnDirection = BallColumnDirectionEnum.Right;
            rowForBlockReduction = rowUp;
            columnForBlockReduction = columnToTheLeft;
        }
        const collisionToTheRightDown = (
            BlockTypes.includes(this.matrix[rowDown][columnToTheRight])
            && newBallState.rowDirection === BallRowDirectionEnum.Down
            && newBallState.columnDirection === BallColumnDirectionEnum.Right
        )
        if (collisionToTheRightDown) {
            newBallState.rowDirection = BallRowDirectionEnum.Up;
            newBallState.columnDirection = BallColumnDirectionEnum.Left;
            rowForBlockReduction = rowDown;
            columnForBlockReduction = columnToTheRight;
        } 
        const collisionToTheRightUp = ( 
            rowUp > 0
            && BlockTypes.includes(this.matrix[rowUp][columnToTheRight])
            && newBallState.rowDirection === BallRowDirectionEnum.Up
            && newBallState.columnDirection === BallColumnDirectionEnum.Right
        )
        if (collisionToTheRightUp) {
            newBallState.rowDirection = BallRowDirectionEnum.Down;
            newBallState.columnDirection = BallColumnDirectionEnum.Left;
            rowForBlockReduction = rowUp;
            columnForBlockReduction = columnToTheRight;
        }

        return [rowForBlockReduction, columnForBlockReduction]
    }

    #reduceBlock = (row, column) => {
        const isBlockColumn = (col) => BlockTypes.includes(this.matrix[row][col]);
        // check to the right
        let columnToCheck = column;
        const columnsToReduce = []
        while (isBlockColumn(columnToCheck)) {
            columnsToReduce.push(columnToCheck);
            columnToCheck += 1;
        }

        // check to the left
        columnToCheck = column - 1;
        while (isBlockColumn(columnToCheck)) {
            columnsToReduce.push(columnToCheck);
            columnToCheck -= 1;
        }

        this.#addMissingColumn(row, columnsToReduce);
        const reducedBlock = BlockReductionMap[this.matrix[row][column]];
        for (let col of columnsToReduce) {
            this.matrix[row][col] = reducedBlock;
        }
    }

    #addMissingColumn = (row, columnsToReduce) => {
        const BlockOrBall = [CellTypeEnum.Ball, ...BlockTypes]
        const minColumn = Math.min(...columnsToReduce);  
        const maxColumn = Math.max(...columnsToReduce);
        const missingColumnOnTheLeft = BlockOrBall.includes(this.matrix[row][minColumn - 1]);
        const missingColumnOnTheRight = BlockOrBall.includes(this.matrix[row][maxColumn + 1]);
        if (missingColumnOnTheLeft) {
            columnsToReduce.push(minColumn - 1);
        } else if (missingColumnOnTheRight) {
            columnsToReduce.push(maxColumn + 1);
        }
    }

    #userWon = () => {
        let userWon = true;
        for (let row of Object.keys(this.initBlocks)) {
            for (let cell of this.matrix[row]) {
                if (cell !== CellTypeEnum.Blank) {
                    userWon = false;
                    break;
                }
            }
        }

        return userWon;
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
        const renderCycles = 2;
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
        const userWidth = 10;
        const userRowIndex = this.numberOfRows - 4;
        const userInitState = UserStateEnum.Static;
        const userRenderCycles = 1;
        this.userBar = new UserBar(userWidth, userRowIndex, userInitState, userRenderCycles);
    }
}
