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

class SimpleCell {
    constructor(row, column) {
        this.row = row
        this.column = column
    }
}

export class BreakoutMatrix {
    constructor(numberOfColumns, numberOfRows, initBlocks, ballSpeed, barSize) {
        this.numberOfColumns = numberOfColumns;
        this.numberOfRows = numberOfRows;
        this.userBar = null;
        this.ball = null;
        this.matrix = null;
        this.updateCalls = 1;
        this.gameState = GameStateEnum.Init;
        this.blockWidth = 5;
        this.initBlocks = initBlocks;
        this.initialize(initBlocks, ballSpeed, barSize);
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

    initialize = (initBlocks, ballSpeed, barSize) => {
        this.#initUserBar(barSize);
        this.#initBall(ballSpeed);
        this.#initMatrix(initBlocks);
        this.updateCalls = 1;
        this.gameState = GameStateEnum.Init;
        this.initBlocks = initBlocks;

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
        let collisionCell = this.#getBlockCellIfHorizontalCollision(newBallState);
        if (collisionCell.row === null && collisionCell.column === null) {
            collisionCell = this.#getBlockCellIfVerticalCollision(newBallState);
        }
        if (collisionCell.row === null && collisionCell.column === null) {
            collisionCell = this.#updateBlockCellIfDiagonalCollision(newBallState);
        }
        if (collisionCell.row === null && collisionCell.column === null) {
            return;
        }
        this.#reduceBlock(collisionCell);
    }

    #getBlockCellIfHorizontalCollision = (newBallState) => {
        let collisionRow = null;
        let collisionColumn = null;
        const blockToTheLeft = BlockTypes.includes(this.matrix[newBallState.row][newBallState.column - 1]);
        const blockToTheRight = BlockTypes.includes(this.matrix[newBallState.row][newBallState.column + 1]);
        if (blockToTheLeft) {
            newBallState.columnDirection = BallColumnDirectionEnum.Right;
            collisionRow = newBallState.row;
            collisionColumn = newBallState.column - 1 
        } else if (blockToTheRight) {
            newBallState.columnDirection = BallColumnDirectionEnum.Left;
            collisionRow = newBallState.row
            collisionColumn = newBallState.column + 1;
        }

        return new SimpleCell(collisionRow, collisionColumn);
    }

    #getBlockCellIfVerticalCollision = (newBallState) => {
        let collisionCell = null;
        let collisionColumn = null;
        const blockOnTop = (newBallState.row > 0) && (BlockTypes.includes(this.matrix[newBallState.row - 1][newBallState.column]));
        const blockBelow = BlockTypes.includes(this.matrix[newBallState.row + 1][newBallState.column]);
        if (blockOnTop) {
            newBallState.rowDirection = BallRowDirectionEnum.Down;
            collisionCell = newBallState.row - 1;
            collisionColumn = newBallState.column;
        } else if (blockBelow) {
            newBallState.rowDirection = BallRowDirectionEnum.Up;
            collisionCell = newBallState.row + 1;
            collisionColumn = newBallState.column;
        }

        return new SimpleCell(collisionCell, collisionColumn)
    }

    #updateBlockCellIfDiagonalCollision = (newBallState) => {
        return this.#updateIfDiagonalCollision(newBallState, BlockTypes)
    }

    #updateIfDiagonalCollision = (newBallState, cellTypes) => {
        let collisionRow = null;
        let collisionColumn = null;
        
        const columnToTheRight = newBallState.column + 1;
        const columnToTheLeft = newBallState.column - 1;
        const rowUp = newBallState.row - 1;
        const rowDown = newBallState.row + 1;   
        
        const collisionToTheLeftDown = (
            cellTypes.includes(this.matrix[rowDown][columnToTheLeft])
            && newBallState.rowDirection === BallRowDirectionEnum.Down
            && newBallState.columnDirection === BallColumnDirectionEnum.Left
        )
        if (collisionToTheLeftDown) {
            newBallState.rowDirection = BallRowDirectionEnum.Up;
            newBallState.columnDirection = BallColumnDirectionEnum.Right;
            collisionRow = rowDown;
            collisionColumn = columnToTheLeft;
        }
        const collisionToTheLeftUp = (
            rowUp > 0
            && cellTypes.includes(this.matrix[rowUp][columnToTheLeft])
            && newBallState.rowDirection === BallRowDirectionEnum.Up
            && newBallState.columnDirection === BallColumnDirectionEnum.Left 
        )
        if (collisionToTheLeftUp) {
            newBallState.rowDirection = BallRowDirectionEnum.Down;
            newBallState.columnDirection = BallColumnDirectionEnum.Right;
            collisionRow = rowUp;
            collisionColumn = columnToTheLeft;
        }
        const collisionToTheRightDown = (
            cellTypes.includes(this.matrix[rowDown][columnToTheRight])
            && newBallState.rowDirection === BallRowDirectionEnum.Down
            && newBallState.columnDirection === BallColumnDirectionEnum.Right
        )
        if (collisionToTheRightDown) {
            newBallState.rowDirection = BallRowDirectionEnum.Up;
            newBallState.columnDirection = BallColumnDirectionEnum.Left;
            collisionRow = rowDown;
            collisionColumn = columnToTheRight;
        } 
        const collisionToTheRightUp = ( 
            rowUp > 0
            && cellTypes.includes(this.matrix[rowUp][columnToTheRight])
            && newBallState.rowDirection === BallRowDirectionEnum.Up
            && newBallState.columnDirection === BallColumnDirectionEnum.Right
        )
        if (collisionToTheRightUp) {
            newBallState.rowDirection = BallRowDirectionEnum.Down;
            newBallState.columnDirection = BallColumnDirectionEnum.Left;
            collisionRow = rowUp;
            collisionColumn = columnToTheRight;
        }

        return new SimpleCell(collisionRow, collisionColumn)
    }

    #reduceBlock = (collisionCell) => {
        const row = collisionCell.row;
        const column = collisionCell.column;
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

        this.#updateIfDiagonalCollision(newBallState, [CellTypeEnum.User])
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
                const userInitArray = this.#createUserInitArray();
                return userInitArray;
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

    #initBall = function(ballSpeed) {
        const initRow = this.userBar.rowIndex - 1;
        const initColumn = Math.round(this.numberOfColumns / 2);
        const columnDirection = BallColumnDirectionEnum.Right;
        const rowDirection = BallRowDirectionEnum.Up;
        const renderCycles = ballSpeed || 2;
        const ball = new Ball(initRow, initColumn, rowDirection, columnDirection, renderCycles);

        this.ball = ball;
    }

    #addBall = (row, column) => {
        this.#assignCellType(row, column, CellTypeEnum.Ball);
    }

    #assignCellType = (row, column, type) => {
        this.matrix[row][column] = type;
    }

    #initUserBar = (barSize) => {
        const userWidth = barSize === 31 ? 31 : 11;
        const userRowIndex = this.numberOfRows - 4;
        const userInitState = UserStateEnum.Static;
        const userRenderCycles = 1;
        this.userBar = new UserBar(userWidth, userRowIndex, userInitState, userRenderCycles);
    }
}


class MatrixUtils {

}

class CollisionChecker {

}