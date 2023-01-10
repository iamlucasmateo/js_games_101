export const GameStateEnum = Object.freeze({
    Start: Symbol("Start"),
    Playing: Symbol("Playing"),
    GameOver: Symbol("Game Over"),
    Init: Symbol("Init")
})


export const UserStateEnum = Object.freeze({
    Left: Symbol("Left"),
    Right: Symbol("Right"),
    Static: Symbol("Static"),
})


export const BallColumnDirectionEnum = Object.freeze({
    Right: Symbol("Right"),
    Left: Symbol("Left")
})


export const BallRowDirectionEnum = Object.freeze({
    Up: Symbol("Up"),
    Down: Symbol("Down")
})


export const CellTypeEnum = Object.freeze({
    Blank: Symbol("Blank"),
    User: Symbol("User"),
    Ball: Symbol("Ball")
})

export const ImageMap = {
    [CellTypeEnum.Blank]: "#FFF",
    [CellTypeEnum.User]: "#0A0",
    [CellTypeEnum.Ball]: "#000"
}

