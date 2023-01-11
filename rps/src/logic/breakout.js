import { 
    BallColumnDirectionEnum,
    BallRowDirectionEnum,
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
    constructor(numberOfColumns, numberOfRows) {
        this.numberOfColumns = numberOfColumns;
        this.numberOfRows = numberOfRows;
        this.userBar = null;
        this.#initUserBar();
        this.ball = null;
        this.#initBall();
        this.matrix = null;
        this.#initMatrix();
        this.updateCalls = 1;
        this.gameState = GameStateEnum.Init;
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

    setGameState = (gameState) => {
        this.gameState = gameState;
    }

    #updateMatrix = () => {
        this.#updateUser();
        this.#updateBall();
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

    #updateBall = () => {
        const newBallState = {...this.ball};
        const skipRenderCycle = this.updateCalls % this.ball.renderCycles !== 0; 
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
        const userBallVerticalCollision = this.#checkUserBallVerticalCollision(newBallState); 
        if (userBallVerticalCollision) {
            newBallState.rowDirection = BallRowDirectionEnum.Up;
        } else if (newBallState.row === 0) {
            newBallState.rowDirection = BallRowDirectionEnum.Down;
        }
        const rowValueUpdate = newBallState.rowDirection === BallRowDirectionEnum.Up ? -1 : 1;
        newBallState.row += rowValueUpdate;
 
        if (this.ball.row === this.numberOfRows - 1) {
            this.gameState = GameStateEnum.GameOver;
        } else {
            this.#assignCellType(this.ball.row, this.ball.column, CellTypeEnum.Blank);
            this.ball = newBallState;
            this.#addBall(this.ball.row, this.ball.column);
        }
        
    }

    #checkUserBallVerticalCollision = (ballState) => {
        // TODO: change this to return an Enum of collisions (vertical, horizontal, none)
        if (ballState.row !== this.userBar.rowIndex - 1) return false;
        const userRow = this.matrix[this.userBar.rowIndex];
        let currentUserStartColumn = userRow.indexOf(CellTypeEnum.User);
        const userColumns = this.#createArray(this.userBar.width, () => ++currentUserStartColumn);
        if (userColumns.includes(ballState.column)) return true;
        
        return false;
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

    #initMatrix = () => {
        const emptyMatrix = Array.from(Array(this.numberOfRows));
        const matrix = emptyMatrix.map((_, row) => {
            if (row === this.userBar.rowIndex) {
                return this.#createUserInitArray();
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
    
    #initBall = function() {
        const initRow = this.userBar.rowIndex - 1;
        const initColumn = Math.round(this.numberOfColumns / 2);
        const columnDirection = BallColumnDirectionEnum.RIGHT;
        const rowDirection = BallRowDirectionEnum.Up;
        const renderCycles = 3;
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
        const userWidth = 7;
        const userRowIndex = this.numberOfRows - 4;
        const userInitState = UserStateEnum.Static;
        const userRenderCycles = 1; 
        this.userBar = new UserBar(userWidth, userRowIndex, userInitState, userRenderCycles);
    }
}
