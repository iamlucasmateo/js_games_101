export const GameStateEnum = Object.freeze({
    Start: Symbol("Start"),
    Playing: Symbol("Playing"),
    GameOver: Symbol("Game Over"),
    Init: Symbol("Init"),
    Paused: Symbol("Paused"),
    UserWon: Symbol("UserWon")
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

const BlockTypesEnum = Object.freeze({
    BlockWithLives_1: Symbol("BlockWithLives_1"),
    BlockWithLives_2: Symbol("BlockWithLives_2"),
    BlockWithLives_3: Symbol("BlockWithLives_3"),
})

export const BlockTypes = Object.values(BlockTypesEnum);

export const CellTypeEnum = Object.freeze({
    Blank: Symbol("Blank"),
    User: Symbol("User"),
    Ball: Symbol("Ball"),
    ...BlockTypesEnum
})

export const BlockReductionMap = {
    [BlockTypesEnum.BlockWithLives_1]: CellTypeEnum.Blank,
    [BlockTypesEnum.BlockWithLives_2]: CellTypeEnum.BlockWithLives_1,
    [BlockTypesEnum.BlockWithLives_3]: CellTypeEnum.BlockWithLives_2,
}

export const InitBlocks2 = {
    8: {
        blockQuantity: 2,
        blockType: BlockTypesEnum.BlockWithLives_1,
    },
}

export const InitBlocks1 = {
    5: {
        blockQuantity: 7,
        blockType: BlockTypesEnum.BlockWithLives_3,
    },
    8: {
        blockQuantity: 7,
        blockType: BlockTypesEnum.BlockWithLives_2,
    },
    11: {
        blockQuantity: 7,
        blockType: BlockTypesEnum.BlockWithLives_1,
    },
}


export const InitBlocks3 = {
    5: {
        blockQuantity: 7,
        blockType: BlockTypesEnum.BlockWithLives_1,
    },
    8: {
        blockQuantity: 7,
        blockType: BlockTypesEnum.BlockWithLives_2,
    },
    11: {
        blockQuantity: 7,
        blockType: BlockTypesEnum.BlockWithLives_1,
    },
}