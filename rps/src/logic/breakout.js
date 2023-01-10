import { 
    BallColumnDirectionEnum,
    BallRowDirectionEnum,
    CellTypeEnum,  
    GameStateEnum,
    UserStateEnum
} from '../schema/breakout'


class BallState {
    constructor(row, column, rowDirection, columnDirection) {
        this.row = row;
        this.column = column;
        this.rowDirection = rowDirection;
        this.columnDirection = columnDirection;
    }
}


export class BreakoutMatrix {
    constructor(numberOfColumns, numberOfRows) {
        this.numberOfColumns = numberOfColumns;
        this.numberOfRows = numberOfRows;
        this.#initialize();
    }

    update = (userState) => {
        this.userState = userState;
        this.#updateMatrix();
        this.updateCalls += 1;

        if (this.updateCalls === Math.max(this.userRenderCycles, this.ballRenderCycles) + 1) {
            this.updateCalls = 1;
        }

        return this.matrix;
    }

    getMatrix = () => this.matrix;

    setGameState = (gameState) => {
        this.gameState = gameState;
    }

    #initialize() {
        this.userWidth = 7;
        this.userRowIndex = this.numberOfRows - 2;
        this.ballState = this.#createInitBallState(); 
        this.matrix = this.#createInitMatrix();
        this.updateCalls = 1;
        this.userState = UserStateEnum.Static;
        this.userRenderCycles = 1;
        this.ballRenderCycles = 2;
        this.gameState = GameStateEnum.Init;
    }

    #updateMatrix = () => {
        const updatedUserArray = this.#getUpdatedUserArray();
        const updatedBallState = this.#getUpdatedBallState(updatedUserArray);
        this.#updatePositions(updatedUserArray, updatedBallState);
    }

    #getUpdatedUserArray = () => {
        const userRow = this.matrix[this.userRowIndex];
        const currentUserStartColumn = userRow.indexOf(CellTypeEnum.User);
        
        const userAtLeftBoundary = currentUserStartColumn === 0;
        const goingLeft = this.userState === UserStateEnum.Left;
        const userAtRightBoundary = currentUserStartColumn + this.userWidth === this.numberOfColumns;
        const goingRight = this.userState === UserStateEnum.Right;
        const skipRenderCycle = (this.userRenderCycles % this.updateCalls !== 0)
        const dontMoveUser = (userAtLeftBoundary && goingLeft) || (userAtRightBoundary && goingRight) || (skipRenderCycle) || this.userState === UserStateEnum.Static;
        
        const valueChange = dontMoveUser ? 0 : this.userState === UserStateEnum.Left ? -1 : 1;
        const newUserArray = this.#createUserArray(currentUserStartColumn + valueChange);
        
        return newUserArray;
    }

    #getUpdatedBallState = (userRow) => {
        const newBallState = {...this.ballState};
        const skipRenderCycle = this.updateCalls % this.ballRenderCycles !== 0; 
        // Don't update ball
        if (skipRenderCycle) {
            return newBallState;
        }

        // Horizontal update 
        if (newBallState.column === this.numberOfColumns) {
            newBallState.columnDirection = BallColumnDirectionEnum.Left;
        } else if (newBallState.column === 0) {
            newBallState.columnDirection = BallColumnDirectionEnum.Right;
        }
        const columnValueUpdate = newBallState.columnDirection === BallColumnDirectionEnum.Right ? 1 : -1;
        newBallState.column += columnValueUpdate;
        
        // Vertical update
        const userBallCollision = this.#checkUserBallCollision(newBallState, userRow); 
        if (userBallCollision) {
            newBallState.rowDirection = BallRowDirectionEnum.Up;
        } else if (newBallState.row === this.numberOfRows) {
            newBallState.rowDirection = BallRowDirectionEnum.Down;
        } else if (newBallState.row === 0) {
            newBallState.rowDirection = BallRowDirectionEnum.Down;
        }
        const rowValueUpdate = newBallState.rowDirection === BallRowDirectionEnum.Up ? -1 : 1;
        newBallState.row += rowValueUpdate;
        
        return newBallState;
    }

    #checkUserBallCollision = (ballState, userRow) => {
        if (ballState.row !== this.userRowIndex - 1) return false;
        let currentUserStartColumn = userRow.indexOf(CellTypeEnum.User);
        const userColumns = this.#createArray(this.userWidth, () => ++currentUserStartColumn);
        if (userColumns.includes(ballState.column)) return true;
        
        return false;
    }

    #updatePositions = (updatedUserArray, updatedBallState) => {
        this.matrix[this.userRowIndex] = updatedUserArray; 
        this.matrix[this.ballState.row] = this.#createBlankRow();
        this.ballState = updatedBallState; 
        if (this.ballState.row === this.numberOfRows) {
            this.gameState = GameStateEnum.GameOver;
        } else {
            this.matrix[this.ballState.row] = this.#createBallArray(this.ballState.column);
        }
    }

    #createRow = (mapFunction) => {
        return this.#createArray(this.numberOfColumns, mapFunction);
    }

    #createBlankRow = () => {
        return this.#createRow(() => CellTypeEnum.Blank);
    }

    #createArray = (length, mapFunction) => {
        return Array.from(Array(length)).map(mapFunction);
    }

    #createUserArray = (userStartColumn) => {
        const userColumns = this.#createArray(this.userWidth, (_, index) => userStartColumn + index);
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
        const columnLeftOfTheUser = Math.floor((this.numberOfColumns - this.userWidth) / 2);
        
        return this.#createUserArray(columnLeftOfTheUser + 1);
    } 

    #createInitMatrix = () => {
        const baseMatrix = Array.from(Array(this.numberOfRows));
        return baseMatrix.map((_, row) => {
            if (row === this.userRowIndex) {
                return this.#createUserInitArray();
            } else if (row === this.ballState.row) {
                return this.#createInitBallArray();
            } else {
                return this.#createBlankRow();
            }
        });
    }
    
    #createInitBallState = function() {
        const initRow = this.userRowIndex - 1;
        const initColumn = Math.round(this.numberOfColumns / 2);
        const columnDirection = BallColumnDirectionEnum.RIGHT;
        const rowDirection = BallRowDirectionEnum.Up;
        const ballState = new BallState(initRow, initColumn, rowDirection, columnDirection); 

        return ballState;
    }   

    #createBallArray = (ballColumn) => {
        const ballRow = this.#createBlankRow();
        ballRow[ballColumn] = CellTypeEnum.Ball;

        return ballRow;
    }

    #createInitBallArray = () => {
        return this.#createBallArray(this.ballState.column);
    }
}
