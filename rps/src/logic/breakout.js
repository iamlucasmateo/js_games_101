import {
    BlockReductionMap,
    BlockTypes,
    CellTypeEnum,
    GameStateEnum,
    UserStateEnum
} from '../schema/breakout'


const BoundaryCollisionEnum = Object.freeze({
    VerticalUp: Symbol("VerticalUp"),
    VerticalDown: Symbol("VerticalDown"),
    HorizontalLeft: Symbol("HorizontalLeft"),
    HorizontalRight: Symbol("HorizontalRight")
})


const BallHorizontalDirectionEnum = Object.freeze({
    Right: Symbol("Right"),
    Left: Symbol("Left")
})


const BallVerticalDirectionEnum = Object.freeze({
    Up: Symbol("Up"),
    Down: Symbol("Down")
})


class Ball {
    constructor(row, column, verticalDirection, horizontalDirection, renderCycles) {
        this.row = row;
        this.column = column;
        this.verticalDirection = verticalDirection;
        this.horizontalDirection = horizontalDirection;
        this.renderCycles = renderCycles;
    }
}

class CollisionOutcome {
    constructor(cell, newHorizontalDirection, newVerticalDirection, fromDiagonal) {
        this.cell = cell;
        this.newHorizontalDirection = newHorizontalDirection;
        this.newVerticalDirection = newVerticalDirection;
        this.fromDiagonal = fromDiagonal
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
        const skipRenderCycle = this.updateCalls % this.ball.renderCycles !== 0;
        // Don't update ball
        if (skipRenderCycle) {
            return;
        }

        const boundaryCollision = this.#checkCollisionsAndUpdateBallDirection();
        const gameOver = boundaryCollision === BoundaryCollisionEnum.VerticalDown;
        if (gameOver) {
            this.gameState = GameStateEnum.GameOver;
        } else {
            this.#updateBallInMatrix();
        }

        if (this.#userWon()) {
            this.gameState = GameStateEnum.UserWon;
        }
    }

    #checkCollisionsAndUpdateBallDirection = () => {
        const collisionChecker = new CollisionChecker(this.ball, this.matrix, this.numberOfColumns, this.numberOfRows);
        const boundaryCollision = collisionChecker.getBoundaryCollision();
        if (boundaryCollision) {
            this.#updateBallStateIfBoundaryCollision(boundaryCollision);
        } else {
            const blockCollision = collisionChecker.getBlockCollision();
            if (blockCollision) {
                this.#updateBallStateIfBlockCollision(blockCollision);
            } else {
                const userRow = this.matrix[this.userBar.rowIndex];
                let currentUserStartColumn = userRow.indexOf(CellTypeEnum.User);
                const userColumns = this.#createArray(this.userBar.width, () => currentUserStartColumn++);
                const userCollision = collisionChecker.getUserCollision(this.userBar.rowIndex, userColumns); 
                if (userCollision) {
                    this.#updateBallStateIfUserCollision(userCollision);
                }
            }
        }

        return boundaryCollision;
    } 

    #updateBallStateIfBoundaryCollision = (boundaryCollision) => {
        if (boundaryCollision === BoundaryCollisionEnum.HorizontalRight) {
            this.ball.horizontalDirection = BallHorizontalDirectionEnum.Left;
        } else if (boundaryCollision === BoundaryCollisionEnum.HorizontalLeft) {
            this.ball.horizontalDirection = BallHorizontalDirectionEnum.Right;
        } else if (boundaryCollision === BoundaryCollisionEnum.VerticalUp) {
            this.ball.verticalDirection = BallVerticalDirectionEnum.Down;
        }
    }

    #updateBallStateIfBlockCollision = (blockCollision) => {
        if (blockCollision.cell.row === null && blockCollision.cell.column === null) {
            return;
        }
        this.ball.verticalDirection = blockCollision.newVerticalDirection;
        this.ball.horizontalDirection = blockCollision.newHorizontalDirection;
        if (blockCollision.fromDiagonal) {
            console.log(blockCollision)
        }
        this.#reduceBlock(blockCollision)
    }

    #reduceBlock = (blockCollision) => {
        const row = blockCollision.cell.row;
        const column = blockCollision.cell.column;
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

        this.#checkAllTheBlockWasDeleted(row, columnsToReduce);
        const reducedBlock = BlockReductionMap[this.matrix[row][column]];
        for (let col of columnsToReduce) {
            this.matrix[row][col] = reducedBlock;
        }
    }

    #checkAllTheBlockWasDeleted = (row, columnsToReduce) => {
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

    #updateBallStateIfUserCollision = (userCollision) => {
        this.ball.verticalDirection = userCollision.newVerticalDirection;
        this.ball.horizontalDirection = userCollision.newHorizontalDirection;
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
        this.#addBallToMatrix();

        return this.matrix
    }

    #initBall = function(ballSpeed) {
        const initRow = this.userBar.rowIndex - 1;
        const initColumn = Math.round(this.numberOfColumns / 2);
        const columnDirection = BallHorizontalDirectionEnum.Right;
        const rowDirection = BallVerticalDirectionEnum.Up;
        const renderCycles = ballSpeed || 2;
        const ball = new Ball(initRow, initColumn, rowDirection, columnDirection, renderCycles);

        this.ball = ball;
    }

    #addBallToMatrix = () => {
        this.#assignCellType(this.ball.row, this.ball.column, CellTypeEnum.Ball);
    }

    #deleteBallFromMatrix = () => {
        this.#assignCellType(this.ball.row, this.ball.column, CellTypeEnum.Blank);
    }

    #updateBallInMatrix = () => {
        this.#deleteBallFromMatrix();   

        const rowValueUpdate = this.ball.verticalDirection === BallVerticalDirectionEnum.Down ? 1 : -1;
        this.ball.row += rowValueUpdate;
        const columnValueUpdate = this.ball.horizontalDirection === BallHorizontalDirectionEnum.Right ? 1 : -1;
        this.ball.column += columnValueUpdate;
        this.#addBallToMatrix(this.ball.row, this.ball.column);
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


class CollisionChecker {
    constructor(ball, matrix, numberOfColumns, numberOfRows) {
        this.ball = ball
        this.matrix = matrix
        this.numberOfColumns = numberOfColumns
        this.numberOfRows = numberOfRows
        this.columnToTheRight = ball.column + 1;
        this.columnToTheLeft = ball.column - 1;
        this.rowUp = ball.row - 1;
        this.rowDown = ball.row + 1;   
    }

    getBoundaryCollision = () => {
        let result = null;
        if (this.ball.column === this.numberOfColumns - 1) {
            result = BoundaryCollisionEnum.HorizontalRight;
        } else if (this.ball.column === 0) {
            result = BoundaryCollisionEnum.HorizontalLeft
        } else if (this.ball.row === 0) {
            result = BoundaryCollisionEnum.VerticalUp;
        } else if (this.ball.row === this.numberOfRows - 1) {
            result = BoundaryCollisionEnum.VerticalDown;
        }

        return result;
    }

    getBlockCollision = () => {
        let collision = this.#getBlockCellHorizontalCollision();
        if (this.#collisionIsNull(collision)) {
            collision = this.#getBlockCellVerticalCollision();
        } else if (this.#collisionIsNull(collision)) {
            collision = this.#getBlockCellDiagonalCollision();
        }

        console.log(
            this.#collisionIsNull(this.#getBlockCellVerticalCollision()),
            this.#collisionIsNull(this.#getBlockCellDiagonalCollision()),
            this.#collisionIsNull(collision),
        )

        return this.#collisionIsNull(collision) ? null : collision;
    }

    getUserCollision = (userRow, userColumns) => {
        const ballIsNotAboveUser = this.ball.row !== userRow - 1; 
        if (ballIsNotAboveUser) return;
        
        let collision;
        if (userColumns.includes(this.ball.column)) {
            const cell = new SimpleCell(null, null);
            collision = new CollisionOutcome(cell, this.ball.horizontalDirection, BallVerticalDirectionEnum.Up) 
        } else {
            collision = this.#getDiagonalCollision([CellTypeEnum.User])
        }

        return collision;
    }

    #collisionIsNull = (collision) => {
        return collision.cell.row === null && collision.cell.column === null;
    }

    #getBlockCellHorizontalCollision = () => {
        let collisionRow = null;
        let collisionColumn = null;
        let newHorizontalDirection = this.ball.horizontalDirection;
        const blockToTheLeft = BlockTypes.includes(this.matrix[this.ball.row][this.columnToTheLeft]);
        const blockToTheRight = BlockTypes.includes(this.matrix[this.ball.row][this.columnToTheRight]);
        if (blockToTheLeft) {
            newHorizontalDirection = BallHorizontalDirectionEnum.Right;
            collisionRow = this.ball.row;
            collisionColumn = this.ball.column - 1 
        } else if (blockToTheRight) {
            newHorizontalDirection = BallHorizontalDirectionEnum.Left;
            collisionRow = this.ball.row
            collisionColumn = this.ball.column + 1;
        }
        const blockCell = new SimpleCell(collisionRow, collisionColumn);
        const collisionOutcome = new CollisionOutcome(blockCell, newHorizontalDirection, this.ball.verticalDirection);

        return collisionOutcome;
    }

    #getBlockCellVerticalCollision = () => {
        let collisionRow = null;
        let collisionColumn = null;
        let newVerticalDirection = this.ball.verticalDirection;
        const blockOnTop = (this.ball.row > 0) && (BlockTypes.includes(this.matrix[this.rowUp][this.ball.column]));
        const blockBelow = (this.ball.row < this.numberOfRows - 1) && BlockTypes.includes(this.matrix[this.rowDown][this.ball.column]);
        if (blockOnTop) {
            newVerticalDirection = BallVerticalDirectionEnum.Down;
            collisionRow = this.rowUp;
            collisionColumn = this.ball.column;
        } else if (blockBelow) {
            newVerticalDirection = BallVerticalDirectionEnum.Up;
            collisionRow = this.rowDown;
            collisionColumn = this.ball.column;
        }

        const blockCell = new SimpleCell(collisionRow, collisionColumn);
        const collisionOutcome = new CollisionOutcome(blockCell, this.ball.horizontalDirection, newVerticalDirection);
        
        return collisionOutcome
    }

    #getBlockCellDiagonalCollision = () => {
        return this.#getDiagonalCollision(BlockTypes)
    }

    #getDiagonalCollision = (cellTypes) => {
        let collisionRow = null;
        let collisionColumn = null;
        let newVerticalDirection = this.ball.verticalDirection;
        let newHorizontalDirection = this.ball.horizontalDirection;
        
        const collisionToTheLeftDown = (
            cellTypes.includes(this.matrix[this.rowDown][this.columnToTheLeft])
            && this.ball.verticalDirection === BallVerticalDirectionEnum.Down
            && this.ball.horizontalDirection === BallHorizontalDirectionEnum.Left
        )
        if (collisionToTheLeftDown) {
            newVerticalDirection = BallVerticalDirectionEnum.Up;
            newHorizontalDirection = BallHorizontalDirectionEnum.Right;
            collisionRow = this.rowDown;
            collisionColumn = this.columnToTheLeft;
        }
        const collisionToTheLeftUp = (
            this.rowUp > 0
            && cellTypes.includes(this.matrix[this.rowUp][this.columnToTheLeft])
            && this.ball.verticalDirection === BallVerticalDirectionEnum.Up
            && this.ball.horizontalDirection === BallHorizontalDirectionEnum.Left 
        )
        if (collisionToTheLeftUp) {
            newVerticalDirection = BallVerticalDirectionEnum.Down;
            newHorizontalDirection = BallHorizontalDirectionEnum.Right;
            collisionRow = this.rowUp;
            collisionColumn = this.columnToTheLeft;
        }
        const collisionToTheRightDown = (
            cellTypes.includes(this.matrix[this.rowDown][this.columnToTheRight])
            && this.ball.verticalDirection === BallVerticalDirectionEnum.Down
            && this.ball.horizontalDirection === BallHorizontalDirectionEnum.Right
        )
        if (collisionToTheRightDown) {
            newVerticalDirection = BallVerticalDirectionEnum.Up;
            newHorizontalDirection = BallHorizontalDirectionEnum.Left;
            collisionRow = this.rowDown;
            collisionColumn = this.columnToTheRight;
        } 
        const collisionToTheRightUp = ( 
            this.rowUp > 0
            && cellTypes.includes(this.matrix[this.rowUp][this.columnToTheRight])
            && this.ball.verticalDirection === BallVerticalDirectionEnum.Up
            && this.ball.horizontalDirection === BallHorizontalDirectionEnum.Right
        )
        if (collisionToTheRightUp) {
            newVerticalDirection = BallVerticalDirectionEnum.Down;
            newHorizontalDirection = BallHorizontalDirectionEnum.Left;
            collisionRow = this.rowUp;
            collisionColumn = this.columnToTheRight;
        }

        const collisionCell = new SimpleCell(collisionRow, collisionColumn);
        const collisionOutcome = new CollisionOutcome(collisionCell, newHorizontalDirection, newVerticalDirection, true);

        return collisionOutcome
    }
}